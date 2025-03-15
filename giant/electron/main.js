const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');

// We'll create the BigQuery client dynamically when executing queries
let bigquery = null;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // In development mode, load from vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    const indexPath = path.join(__dirname, '../dist/index.html');
    
    // Check if the file exists
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      console.error(`Error: Could not find ${indexPath}`);
      // Fallback to development URL if dist file doesn't exist
      mainWindow.loadURL('http://localhost:5173');
      mainWindow.webContents.openDevTools();
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (mainWindow === null) createWindow();
  });
});

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
    
    // Execute query with options
    const [rows] = await bigquery.query(options);
    return rows;
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

// Helper function to format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
