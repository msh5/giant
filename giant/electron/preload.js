const { contextBridge, ipcRenderer } = require('electron');

// Expose API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  executeQuery: (query) => ipcRenderer.invoke('execute-query', query),
});

// Expose platform information
contextBridge.exposeInMainWorld('platform', {
  isElectron: true,
});
