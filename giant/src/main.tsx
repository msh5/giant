import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add type definitions for Electron API
declare global {
  interface Window {
    electronAPI?: {
      executeQuery: (query: string) => Promise<any[]>;
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
