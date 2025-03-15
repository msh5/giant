const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');
const { URL } = require('url');

// We'll dynamically import electron-store since it's an ESM module
let Store;

// We'll create the BigQuery client dynamically when executing queries
let bigquery = null;

// Dynamically import electron-store
(async () => {
  try {
    const module = await import('electron-store');
    Store = module.default;
  } catch (error) {
    console.error('Failed to import electron-store:', error);
  }
})();

// Project file extension and content type
const PROJECT_FILE_EXT = '.giantproj';
const PROJECT_CONTENT_TYPE = 'application/x-giant-project';

// Track windows and their associated projects
const windowProjects = new Map();

let mainWindow;

function createWindow(projectPath = null) {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Associate the window with a project if provided
  if (projectPath) {
    windowProjects.set(win.id, projectPath);
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
  });

  return win;
}

app.whenReady().then(() => {
  // Check if we have a project file in the arguments
  const projectPath = process.argv.find(arg => arg.endsWith(PROJECT_FILE_EXT));
  
  // Create main window with project if provided
  mainWindow = createWindow(projectPath);

  // Register file extension handler
  if (process.platform === 'win32') {
    app.setAsDefaultProtocolClient('giant');
  }

  // Handle file open events (macOS)
  app.on('open-file', (event, path) => {
    event.preventDefault();
    openProjectInWindow(path);
  });

  app.on('activate', () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

// Function to open a project in a window
function openProjectInWindow(projectPath, win = null) {
  // If no window is provided, check if there's already a window for this project
  if (!win) {
    const windows = BrowserWindow.getAllWindows();
    for (const existingWin of windows) {
      if (windowProjects.get(existingWin.id) === projectPath) {
        existingWin.focus();
        return;
      }
    }
    // No existing window for this project, create a new one
    win = createWindow(projectPath);
  }

  // Associate the window with the project
  windowProjects.set(win.id, projectPath);
  
  // Notify the renderer process about the project
  win.webContents.once('did-finish-load', () => {
    win.webContents.send('project-opened', projectPath);
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Handle BigQuery query execution
ipcMain.handle('execute-query', async (event, query, projectId, defaultDataset, location) => {
  try {
    // Create or update BigQuery client with the provided project ID
    bigquery = new BigQuery({
      // No need to specify credentials, will use application default credentials
      projectId: projectId || process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id',
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
    // Create or update BigQuery client with the provided project ID
    bigquery = new BigQuery({
      projectId: projectId || process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id',
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
    // Create or update BigQuery client with the provided project ID
    bigquery = new BigQuery({
      projectId: projectId || process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id',
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

// Handle saving a project file
ipcMain.handle('save-project', async (event, projectData) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    
    // Get the current project path or ask for a new one
    let projectPath = windowProjects.get(win.id);
    
    if (!projectPath) {
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: 'Save Project',
        defaultPath: projectData.projectId + PROJECT_FILE_EXT,
        filters: [
          { name: 'Giant Project Files', extensions: [PROJECT_FILE_EXT.substring(1)] }
        ]
      });
      
      if (canceled || !filePath) {
        return { success: false, message: 'Save canceled' };
      }
      
      projectPath = filePath;
      windowProjects.set(win.id, projectPath);
    }
    
    // Save the project data to the file
    fs.writeFileSync(projectPath, JSON.stringify(projectData, null, 2));
    
    return { success: true, path: projectPath };
  } catch (error) {
    console.error('Error saving project:', error);
    return { success: false, message: error.message };
  }
});

// Handle opening a project file
ipcMain.handle('open-project', async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Open Project',
      properties: ['openFile'],
      filters: [
        { name: 'Giant Project Files', extensions: [PROJECT_FILE_EXT.substring(1)] }
      ]
    });
    
    if (canceled || filePaths.length === 0) {
      return { success: false, message: 'Open canceled' };
    }
    
    const projectPath = filePaths[0];
    
    // Check if this project is already open in another window
    const windows = BrowserWindow.getAllWindows();
    for (const existingWin of windows) {
      if (existingWin.id !== win.id && windowProjects.get(existingWin.id) === projectPath) {
        existingWin.focus();
        return { success: false, message: 'Project already open in another window' };
      }
    }
    
    // Read the project data
    const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
    
    // Associate the window with the project
    windowProjects.set(win.id, projectPath);
    
    return { success: true, path: projectPath, data: projectData };
  } catch (error) {
    console.error('Error opening project:', error);
    return { success: false, message: error.message };
  }
});

// Handle creating a new project window
ipcMain.handle('new-project-window', async (event) => {
  try {
    createWindow();
    return { success: true };
  } catch (error) {
    console.error('Error creating new project window:', error);
    return { success: false, message: error.message };
  }
});

// Handle getting the current project path
ipcMain.handle('get-current-project', async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const projectPath = windowProjects.get(win.id);
    
    if (!projectPath) {
      return { success: false, message: 'No project associated with this window' };
    }
    
    // Read the project data
    const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
    
    return { success: true, path: projectPath, data: projectData };
  } catch (error) {
    console.error('Error getting current project:', error);
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
