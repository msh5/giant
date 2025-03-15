const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  executeQuery: (query, projectId, defaultDataset, location) => ipcRenderer.invoke('execute-query', query, projectId, defaultDataset, location),
  estimateQuerySize: (query, projectId, defaultDataset, location) => ipcRenderer.invoke('estimate-query-size', query, projectId, defaultDataset, location),
  confirmLargeQuery: (bytesProcessed, warnSizeBytes, showAlways) => ipcRenderer.invoke('confirm-large-query', bytesProcessed, warnSizeBytes, showAlways),
  listDatasets: (projectId) => ipcRenderer.invoke('list-datasets', projectId),
  // New project file operations
  saveProject: (projectData) => ipcRenderer.invoke('save-project', projectData),
  openProject: () => ipcRenderer.invoke('open-project'),
  newProjectWindow: () => ipcRenderer.invoke('new-project-window'),
  getCurrentProject: () => ipcRenderer.invoke('get-current-project'),
});

// Expose platform information
contextBridge.exposeInMainWorld('platform', {
  isElectron: true,
});

// Set up event listeners for project events
ipcRenderer.on('project-opened', (event, projectPath) => {
  // Forward the event to the window
  window.dispatchEvent(new CustomEvent('project-opened', { detail: projectPath }));
});
