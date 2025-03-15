const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');

// We'll create the BigQuery client dynamically when executing queries
let bigquery = null;

// Track windows and their associated GCP project IDs
const windowProjects = new Map();

// Function to prompt for project ID
async function promptForProjectId() {
  return new Promise((resolve) => {
    // Create a small browser window for the prompt
    const promptWindow = new BrowserWindow({
      width: 400,
      height: 200,
      resizable: false,
      minimizable: false,
      maximizable: false,
      parent: null,
      modal: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
      }
    });
    
    // HTML content for the prompt
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Enter Project ID</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          h3 {
            margin-top: 0;
          }
          input {
            width: 100%;
            padding: 8px;
            margin: 10px 0 15px 0;
            box-sizing: border-box;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          .buttons {
            display: flex;
            justify-content: flex-end;
          }
          button {
            padding: 8px 16px;
            margin-left: 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .cancel {
            background-color: #f1f1f1;
          }
          .ok {
            background-color: #4285f4;
            color: white;
          }
        </style>
      </head>
      <body>
        <h3>Project ID Required</h3>
        <p>Please enter your Google Cloud Project ID:</p>
        <input type="text" id="projectId" placeholder="your-project-id" autofocus />
        <div class="buttons">
          <button class="cancel" id="cancel">Cancel</button>
          <button class="ok" id="ok">OK</button>
        </div>
        <script>
          const input = document.getElementById('projectId');
          const okButton = document.getElementById('ok');
          const cancelButton = document.getElementById('cancel');
          
          // Submit on Enter key
          input.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
              submitValue();
            }
          });
          
          // Submit on OK button click
          okButton.addEventListener('click', submitValue);
          
          // Cancel on Cancel button click
          cancelButton.addEventListener('click', () => {
            window.electronAPI.submitProjectId('');
          });
          
          function submitValue() {
            const value = input.value.trim();
            if (value) {
              window.electronAPI.submitProjectId(value);
            }
          }
        </script>
      </body>
      </html>
    `;
    
    // Set up IPC for the prompt window
    const preloadScript = `
      const { contextBridge, ipcRenderer } = require('electron');
      
      contextBridge.exposeInMainWorld('electronAPI', {
        submitProjectId: (projectId) => ipcRenderer.send('submit-project-id', projectId)
      });
    `;
    
    // Write preload script to a temporary file
    const preloadPath = path.join(app.getPath('temp'), 'project-id-preload.js');
    fs.writeFileSync(preloadPath, preloadScript);
    
    // Update webPreferences to use the preload script
    promptWindow.webPreferences = {
      ...promptWindow.webPreferences,
      preload: preloadPath
    };
    
    // Load HTML content
    promptWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    
    // Show window when ready
    promptWindow.once('ready-to-show', () => {
      promptWindow.show();
    });
    
    // Handle project ID submission
    ipcMain.once('submit-project-id', (event, projectId) => {
      promptWindow.close();
      resolve(projectId);
    });
    
    // Handle window close
    promptWindow.on('closed', () => {
      ipcMain.removeAllListeners('submit-project-id');
      if (!promptWindow.isDestroyed()) {
        promptWindow.destroy();
      }
      resolve(null);
    });
  });
}

let mainWindow;

async function createWindow(projectId) {
  // If no project ID is provided, prompt for one
  if (!projectId) {
    projectId = await promptForProjectId();
    
    // If user cancels or doesn't provide a project ID, quit the app
    if (!projectId) {
      app.quit();
      return null;
    }
  }
  
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Associate the window with a project ID if provided
  if (projectId) {
    windowProjects.set(win.id, projectId);
  }

  // In development mode, load from vite dev server
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // In production, load from built files
    const indexPath = path.join(__dirname, '../dist/index.html');
    
    // Check if the file exists
    if (fs.existsSync(indexPath)) {
      win.loadFile(indexPath);
    } else {
      console.error(`Error: Could not find ${indexPath}`);
      // Fallback to development URL if dist file doesn't exist
      win.loadURL('http://localhost:5173');
      win.webContents.openDevTools();
    }
  }

  // Clean up when window is closed
  win.on('closed', () => {
    windowProjects.delete(win.id);
    if (win === mainWindow) mainWindow = null;
  });
  
  return win;
}

app.whenReady().then(async () => {
  // Check if we have a project ID in the arguments
  const projectIdArg = process.argv.find(arg => arg.startsWith('--project-id='));
  const projectId = projectIdArg ? projectIdArg.split('=')[1] : null;
  
  // Create main window with project ID (will prompt if null)
  mainWindow = await createWindow(projectId);

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      // Check if we have a project ID in the arguments
      const projectIdArg = process.argv.find(arg => arg.startsWith('--project-id='));
      const projectId = projectIdArg ? projectIdArg.split('=')[1] : null;
      
      // Create a new window with project ID (will prompt if null)
      mainWindow = await createWindow(projectId);
    }
  });
  
  // Handle second instance
  app.on('second-instance', async (event, commandLine, workingDirectory) => {
    // Check if the second instance has a project ID
    const projectIdArg = commandLine.find(arg => arg.startsWith('--project-id='));
    const projectId = projectIdArg ? projectIdArg.split('=')[1] : null;
    
    if (projectId) {
      // Check if this project is already open in a window
      const windows = BrowserWindow.getAllWindows();
      for (const win of windows) {
        if (windowProjects.get(win.id) === projectId) {
          // Focus the existing window
          if (win.isMinimized()) win.restore();
          win.focus();
          return;
        }
      }
      // If not open, create a new window with this project
      await createWindow(projectId);
    } else {
      // If no project ID is provided, create a new window (will prompt for project ID)
      if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow(null);
      } else {
        // Focus the main window
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
      }
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Handle BigQuery query execution
ipcMain.handle('execute-query', async (event, query, projectId, defaultDataset, location) => {
  try {
    // Get the window's project ID if available
    const win = BrowserWindow.fromWebContents(event.sender);
    const windowProjectId = windowProjects.get(win.id);
    
    // Create or update BigQuery client with the provided project ID or window's project ID
    bigquery = new BigQuery({
      // No need to specify credentials, will use application default credentials
      projectId: projectId || windowProjectId || process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id',
    });
    
    // Create query job with options
    const options = {
      query: query
    };
    
    // Add default dataset if provided
    if (defaultDataset) {
      options.defaultDataset = {
        datasetId: defaultDataset.datasetId,
        projectId: defaultDataset.projectId || projectId
      };
    }
    
    // Add location if provided
    if (location) {
      options.location = location;
    }
    
    // Execute query with options and get job information
    const [job] = await bigquery.createQueryJob(options);
    const [rows] = await job.getQueryResults();
    
    // Return both job metadata and query results
    return {
      jobInfo: job.metadata,
      results: rows
    };
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
});

// Handle dry run query to estimate size
ipcMain.handle('estimate-query-size', async (event, query, projectId, defaultDataset, location) => {
  try {
    // Get the window's project ID if available
    const win = BrowserWindow.fromWebContents(event.sender);
    const windowProjectId = windowProjects.get(win.id);
    
    // Create or update BigQuery client with the provided project ID or window's project ID
    bigquery = new BigQuery({
      projectId: projectId || windowProjectId || process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id',
    });
    
    // Create options for dry run
    const options = {
      query: query,
      dryRun: true
    };
    
    // Add default dataset if provided
    if (defaultDataset) {
      options.defaultDataset = {
        datasetId: defaultDataset.datasetId,
        projectId: defaultDataset.projectId || projectId
      };
    }
    
    // Add location if provided
    if (location) {
      options.location = location;
    }
    
    // Create a dry run job to estimate query size
    const [job] = await bigquery.createQueryJob(options);
    
    // Return the total bytes processed
    return job.metadata.statistics.totalBytesProcessed;
  } catch (error) {
    console.error('Error estimating query size:', error);
    throw error;
  }
});

// Handle confirmation dialog for large queries
ipcMain.handle('confirm-large-query', async (event, bytesProcessed, warnSizeBytes, showAlways) => {
  try {
    // Format bytes for display
    const formattedBytes = formatBytes(bytesProcessed);
    const formattedWarnSize = formatBytes(parseInt(warnSizeBytes));
    
    // Show confirmation dialog
    const { response, checkboxChecked } = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Yes', 'No'],
      title: 'Query Size Warning',
      message: 'This query will process a large amount of data',
      detail: `This query will process ${formattedBytes} of data${bytesProcessed > parseInt(warnSizeBytes) ? `, which exceeds your warning threshold of ${formattedWarnSize}` : ''}.
Do you want to continue?`,
      checkboxLabel: 'Don\'t show this warning again',
      checkboxChecked: false,
    });
    
    // Return result object with user response and checkbox state
    return {
      confirmed: response === 0, // true if user clicked "Yes" (index 0)
      dontShowAgain: checkboxChecked
    };
  } catch (error) {
    console.error('Error showing confirmation dialog:', error);
    throw error;
  }
});

// Handle listing datasets for a project
ipcMain.handle('list-datasets', async (event, projectId) => {
  try {
    // Get the window's project ID if available
    const win = BrowserWindow.fromWebContents(event.sender);
    const windowProjectId = windowProjects.get(win.id);
    
    // Create or update BigQuery client with the provided project ID or window's project ID
    bigquery = new BigQuery({
      projectId: projectId || windowProjectId || process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id',
    });
    
    // Get datasets for the project
    const [datasets] = await bigquery.getDatasets();
    
    // Return dataset information
    return datasets.map(dataset => ({
      id: dataset.id,
      projectId: dataset.projectId,
      location: dataset.location
    }));
  } catch (error) {
    console.error('Error listing datasets:', error);
    throw error;
  }
});

// Handle opening a project in a new window
ipcMain.handle('open-project-in-new-window', async (event, projectId) => {
  try {
    if (!projectId) {
      return { success: false, message: 'Project ID is required' };
    }
    
    // Check if this project is already open in a window
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (windowProjects.get(win.id) === projectId) {
        // Focus the existing window
        if (win.isMinimized()) win.restore();
        win.focus();
        return { success: true, message: 'Project already open in another window' };
      }
    }
    
    // Create a new window with this project
    await createWindow(projectId);
    return { success: true };
  } catch (error) {
    console.error('Error opening project in new window:', error);
    return { success: false, message: error.message };
  }
});

// Handle getting the current project ID
ipcMain.handle('get-current-project-id', async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const projectId = windowProjects.get(win.id);
    
    return { success: true, projectId };
  } catch (error) {
    console.error('Error getting current project ID:', error);
    return { success: false, message: error.message };
  }
});

// Handle setting the current project ID
ipcMain.handle('set-current-project-id', async (event, projectId) => {
  try {
    if (!projectId) {
      return { success: false, message: 'Project ID is required' };
    }
    
    const win = BrowserWindow.fromWebContents(event.sender);
    windowProjects.set(win.id, projectId);
    
    // Notify the window that the project ID has changed
    win.webContents.send('project-id-changed', projectId);
    
    return { success: true };
  } catch (error) {
    console.error('Error setting current project ID:', error);
    return { success: false, message: error.message };
  }
});

// Helper function to format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
