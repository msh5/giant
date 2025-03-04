import { useState, useEffect } from 'react'
import './App.css'
import SqlEditor from './components/custom/SqlEditor'
import ResultsTable from './components/custom/ResultsTable'

// Check if running in Electron
const isElectron = window.platform?.isElectron || false;

function App() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string>(() => {
    // Initialize from localStorage if available
    return localStorage.getItem('bigquery_project_id') || '';
  });

  // Save projectId to localStorage whenever it changes
  useEffect(() => {
    if (projectId) {
      localStorage.setItem('bigquery_project_id', projectId);
    }
  }, [projectId]);

  const handleExecuteQuery = async (query: string) => {
    setLoading(true)
    setError(null)

    try {
      let data;
      if (isElectron && window.electronAPI) {
        // Use Electron IPC for BigQuery queries
        data = await window.electronAPI.executeQuery(query, projectId);
      } else {
        // Fallback for web (development only)
        throw new Error('This application is designed to run as a desktop application');
      }
      
      setResults(data)
    } catch (error) {
      console.error('Query execution error:', error)
      setError('Failed to execute query: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="bg-blue-600 text-white p-6 rounded-lg shadow-lg mb-8">
        <h1 className="text-3xl font-bold">Giant</h1>
        <p className="text-sm mt-2">BigQuery Desktop Client</p>
      </header>
      <main>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-4">Project Settings</h2>
          <div className="flex items-center">
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mr-2">
              Google Cloud Project ID:
            </label>
            <input
              type="text"
              id="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 block w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              placeholder="your-project-id"
            />
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SQL Query</h2>
          <SqlEditor onExecute={handleExecuteQuery} />
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Results</h2>
          <ResultsTable data={results} loading={loading} error={error} />
        </div>
      </main>
    </div>
  )
}

export default App
