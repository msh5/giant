const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  executeQuery: (query, projectId) => ipcRenderer.invoke('execute-query', query, projectId),
  estimateQuerySize: (query, projectId) => ipcRenderer.invoke('estimate-query-size', query, projectId),
  confirmLargeQuery: (bytesProcessed, warnSizeBytes, showAlways) => ipcRenderer.invoke('confirm-large-query', bytesProcessed, warnSizeBytes, showAlways),
});

// Expose platform information
contextBridge.exposeInMainWorld('platform', {
  isElectron: true,
});
