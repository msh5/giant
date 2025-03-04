const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  executeQuery: (query) => ipcRenderer.invoke('execute-query', query),
});

// Expose platform information
contextBridge.exposeInMainWorld('platform', {
  isElectron: true,
});
