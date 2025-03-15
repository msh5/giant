const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  executeQuery: (query, projectId, defaultDataset, location) => ipcRenderer.invoke('execute-query', query, projectId, defaultDataset, location),
  estimateQuerySize: (query, projectId, defaultDataset, location) => ipcRenderer.invoke('estimate-query-size', query, projectId, defaultDataset, location),
  confirmLargeQuery: (bytesProcessed, warnSizeBytes, showAlways) => ipcRenderer.invoke('confirm-large-query', bytesProcessed, warnSizeBytes, showAlways),
  listDatasets: (projectId) => ipcRenderer.invoke('list-datasets', projectId),
});

// Expose platform information
contextBridge.exposeInMainWorld('platform', {
  isElectron: true,
});
