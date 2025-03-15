import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add type definitions for Electron API
declare global {
  interface Window {
    electronAPI?: {
      executeQuery: (query: string, projectId: string, defaultDataset?: {datasetId: string, projectId?: string}, location?: string) => Promise<{jobInfo: any, results: any[]}>;
      estimateQuerySize: (query: string, projectId: string, defaultDataset?: {datasetId: string, projectId?: string}, location?: string) => Promise<string>;
      confirmLargeQuery: (bytesProcessed: string, warnSizeBytes: string, showAlways: boolean) => Promise<{confirmed: boolean, dontShowAgain: boolean}>;
      listDatasets: (projectId: string) => Promise<Array<{id: string, projectId: string, location: string}>>;
      // New project file operations
      saveProject: (projectData: any) => Promise<{success: boolean, path?: string, message?: string}>;
      openProject: () => Promise<{success: boolean, path?: string, data?: any, message?: string}>;
      newProjectWindow: () => Promise<{success: boolean, message?: string}>;
      getCurrentProject: () => Promise<{success: boolean, path?: string, data?: any, message?: string}>;
    };
    platform?: {
      isElectron: boolean;
    };
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
