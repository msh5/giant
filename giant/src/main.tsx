import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add type definitions for Electron API
declare global {
  interface Window {
    electronAPI?: {
      executeQuery: (query: string, projectId: string, defaultDataset?: {datasetId: string, projectId?: string}, location?: string) => Promise<any[]>;
      estimateQuerySize: (query: string, projectId: string, defaultDataset?: {datasetId: string, projectId?: string}, location?: string) => Promise<string>;
      confirmLargeQuery: (bytesProcessed: string, warnSizeBytes: string, showAlways: boolean) => Promise<{confirmed: boolean, dontShowAgain: boolean}>;
      listDatasets: (projectId: string) => Promise<Array<{id: string, projectId: string, location: string}>>;
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
