const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { BigQuery } = require('@google-cloud/bigquery');

// Create BigQuery client with application default credentials
const bigquery = new BigQuery({
  // No need to specify credentials, will use application default credentials
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id',
});

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
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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
ipcMain.handle('execute-query', async (event, query) => {
  try {
    const [rows] = await bigquery.query(query);
    return rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
});
