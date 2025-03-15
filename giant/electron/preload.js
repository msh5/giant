const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  executeQuery: (query, projectId, defaultDataset, location) => ipcRenderer.invoke('execute-query', query, projectId, defaultDataset, location),
  estimateQuerySize: (query, projectId, defaultDataset, location) => ipcRenderer.invoke('estimate-query-size', query, projectId, defaultDataset, location),
  confirmLargeQuery: (bytesProcessed, warnSizeBytes, showAlways) => ipcRenderer.invoke('confirm-large-query', bytesProcessed, warnSizeBytes, showAlways),
  listDatasets: (projectId) => ipcRenderer.invoke('list-datasets', projectId),
  openProjectInNewWindow: (projectId) => ipcRenderer.invoke('open-project-in-new-window', projectId),
  getCurrentProjectId: () => ipcRenderer.invoke('get-current-project-id'),
  setCurrentProjectId: (projectId) => ipcRenderer.invoke('set-current-project-id', projectId),
  promptForProjectId: (title) => ipcRenderer.invoke('prompt-for-project-id', title),
});

// Expose platform information
contextBridge.exposeInMainWorld('platform', {
  isElectron: true,
});

// Set up event listeners for project ID changes
ipcRenderer.on('project-id-changed', (event, projectId) => {
  // Forward the event to the window
  window.dispatchEvent(new CustomEvent('project-id-changed', { detail: projectId }));
});
