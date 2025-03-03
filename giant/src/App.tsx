import { useState } from 'react'
import './App.css'
import SqlEditor from './components/custom/SqlEditor'
import ResultsTable from './components/custom/ResultsTable'
import { authenticate } from './services/auth'
import { executeQuery } from './services/bigquery'

function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(false)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuthenticate = async () => {
    try {
      await authenticate()
      setAuthenticated(true)
    } catch (error) {
      console.error('Authentication error:', error)
      setError('Failed to authenticate')
    }
  }

  const handleExecuteQuery = async (query: string) => {
    if (!authenticated) {
      setError('Please authenticate first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await executeQuery(query)
      setResults(data)
    } catch (error) {
      console.error('Query execution error:', error)
      setError('Failed to execute query')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="bg-blue-600 text-white p-6 rounded-lg shadow-lg mb-8">
        <h1 className="text-3xl font-bold">BigQuery GUI Client</h1>
      </header>
      <main>
        <div className="mb-8">
          <button 
            onClick={handleAuthenticate} 
            disabled={authenticated}
            className={`px-4 py-2 rounded font-bold ${authenticated ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700'} text-white`}
          >
            {authenticated ? 'Authenticated' : 'Authenticate with Google'}
          </button>
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
