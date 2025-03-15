import { useState, useEffect } from 'react'
import './App.css'
import SqlEditor from './components/custom/SqlEditor'
import ResultsTable from './components/custom/ResultsTable'
import JobInfoTable from './components/custom/JobInfoTable'
import TabView from './components/custom/TabView'
import SessionsPane, { Session } from './components/custom/SessionsPane'
import { v4 as uuidv4 } from 'uuid'

// Check if running in Electron
const isElectron = window.platform?.isElectron || false;

function App() {
  // Sessions state
  const [sessions, setSessions] = useState<Session[]>(() => {
    // Initialize from localStorage if available
    const savedSessions = localStorage.getItem('bigquery_sessions');
    return savedSessions ? JSON.parse(savedSessions) : [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    // Initialize from localStorage if available
    return localStorage.getItem('bigquery_active_session_id');
  });

  // Current session data
  const [results, setResults] = useState<any[]>([])
  const [jobInfo, setJobInfo] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [projectId, setProjectId] = useState<string>(() => {
    // Initialize from localStorage if available
    return localStorage.getItem('bigquery_project_id') || '';
  });

  // Add new state for warning threshold
  const [warnSizeBytes, setWarnSizeBytes] = useState<string>(() => {
    // Initialize from localStorage if available
    return localStorage.getItem('bigquery_warn_size_bytes') || '1073741824'; // Default to 1GB
  });

  // Add new state for warning dialog display preference
  const [showQuerySizeWarning, setShowQuerySizeWarning] = useState<boolean>(() => {
    // Initialize from localStorage if available
    const savedPref = localStorage.getItem('bigquery_show_size_warning');
    return savedPref === null ? true : savedPref === 'true';
  });
  
  // Add new state for default dataset and location (non-persistent)
  const [availableDatasets, setAvailableDatasets] = useState<Array<{id: string, projectId: string, location: string}>>([]);
  const [defaultDataset, setDefaultDataset] = useState<{datasetId: string, projectId?: string} | null>(null);
  const [queryLocation, setQueryLocation] = useState<string | null>(null);
  
  // Define location options with specific regions
  const locationOptions = [
    // US regions
    { value: 'us-central1', label: 'us-central1 (Iowa)' },
    { value: 'us-east1', label: 'us-east1 (South Carolina)' },
    { value: 'us-east4', label: 'us-east4 (Northern Virginia)' },
    { value: 'us-west1', label: 'us-west1 (Oregon)' },
    { value: 'us-west2', label: 'us-west2 (Los Angeles)' },
    { value: 'us-west3', label: 'us-west3 (Salt Lake City)' },
    { value: 'us-west4', label: 'us-west4 (Las Vegas)' },
    
    // Europe regions
    { value: 'europe-west1', label: 'europe-west1 (Belgium)' },
    { value: 'europe-west2', label: 'europe-west2 (London)' },
    { value: 'europe-west3', label: 'europe-west3 (Frankfurt)' },
    { value: 'europe-west4', label: 'europe-west4 (Netherlands)' },
    { value: 'europe-west6', label: 'europe-west6 (Zurich)' },
    
    // Asia regions
    { value: 'asia-east1', label: 'asia-east1 (Taiwan)' },
    { value: 'asia-east2', label: 'asia-east2 (Hong Kong)' },
    { value: 'asia-northeast1', label: 'asia-northeast1 (Tokyo)' },
    { value: 'asia-northeast2', label: 'asia-northeast2 (Osaka)' },
    { value: 'asia-northeast3', label: 'asia-northeast3 (Seoul)' },
    { value: 'asia-south1', label: 'asia-south1 (Mumbai)' },
    { value: 'asia-southeast1', label: 'asia-southeast1 (Singapore)' },
    { value: 'asia-southeast2', label: 'asia-southeast2 (Jakarta)' },
    
    // Australia regions
    { value: 'australia-southeast1', label: 'australia-southeast1 (Sydney)' },
    
    // Multi-regional options
    { value: 'US', label: 'US (multi-region)' },
    { value: 'EU', label: 'EU (multi-region)' },
    { value: 'ASIA', label: 'Asia (multi-region)' }
  ];

  // Save projectId to localStorage whenever it changes
  useEffect(() => {
    if (projectId) {
      localStorage.setItem('bigquery_project_id', projectId);
    }
  }, [projectId]);
  
  // Save warnSizeBytes to localStorage whenever it changes
  useEffect(() => {
    if (warnSizeBytes) {
      localStorage.setItem('bigquery_warn_size_bytes', warnSizeBytes);
    }
  }, [warnSizeBytes]);

  // Save showQuerySizeWarning to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bigquery_show_size_warning', showQuerySizeWarning.toString());
  }, [showQuerySizeWarning]);
  
  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bigquery_sessions', JSON.stringify(sessions));
  }, [sessions]);
  
  // Save active session ID to localStorage whenever it changes
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('bigquery_active_session_id', activeSessionId);
    }
  }, [activeSessionId]);
  
  // Fetch datasets when projectId changes
  useEffect(() => {
    const fetchDatasets = async () => {
      if (!projectId || !isElectron || !window.electronAPI) {
        setAvailableDatasets([]);
        return;
      }
      
      try {
        const datasets = await window.electronAPI.listDatasets(projectId);
        setAvailableDatasets(datasets);
      } catch (error) {
        console.error('Error fetching datasets:', error);
        setAvailableDatasets([]);
      }
    };
    
    fetchDatasets();
  }, [projectId]);

  const handleExecuteQuery = async (query: string) => {
    setLoading(true)
    setError(null)
    // Reset to first page when executing a new query
    setCurrentPage(1)
    
    try {
      if (isElectron && window.electronAPI) {
        // Estimate query size first
        const bytesProcessed = await window.electronAPI.estimateQuerySize(query, projectId, defaultDataset || undefined, queryLocation || undefined);
        
        // Check if we should show warning dialog
        let shouldExecute = true;
        
        // Show warning dialog if enabled or if size exceeds threshold
        if (showQuerySizeWarning || parseInt(bytesProcessed) > parseInt(warnSizeBytes)) {
          const result = await window.electronAPI.confirmLargeQuery(bytesProcessed, warnSizeBytes, showQuerySizeWarning);
          
          // Update warning dialog preference if user checked "Don't show again"
          if (result.dontShowAgain) {
            setShowQuerySizeWarning(false);
          }
          
          // Only execute if user confirmed
          shouldExecute = result.confirmed;
        }
        
        if (shouldExecute) {
          // Execute the query if user confirmed or warning was skipped
          const response = await window.electronAPI.executeQuery(query, projectId, defaultDataset || undefined, queryLocation || undefined);
          setJobInfo(response.jobInfo);
          setResults(response.results);
          
          // Create or update session
          const timestamp = new Date();
          
          if (activeSessionId) {
            // Update existing session
            setSessions(prevSessions => 
              prevSessions.map(session => 
                session.id === activeSessionId 
                  ? { ...session, query, results: response.results, jobInfo: response.jobInfo, updatedAt: timestamp }
                  : session
              )
            );
          } else {
            // Create new session
            const newSession: Session = {
              id: uuidv4(),
              name: `Session ${sessions.length + 1}`,
              query,
              results: response.results,
              jobInfo: response.jobInfo,
              createdAt: timestamp
            };
            
            setSessions(prevSessions => [...prevSessions, newSession]);
            setActiveSessionId(newSession.id);
          }
        } else {
          // User cancelled the query
          setLoading(false);
          return;
        }
      } else {
        // Fallback for web (development only)
        throw new Error('This application is designed to run as a desktop application');
      }
    } catch (error) {
      console.error('Query execution error:', error)
      setError('Failed to execute query: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Session management functions
  const handleSessionSelect = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      // Load session data
      setResults(session.results || []);
      setJobInfo(session.jobInfo || null);
      // Reset to first page
      setCurrentPage(1);
    }
  };
  
  const handleSessionCreate = () => {
    const newSession: Session = {
      id: uuidv4(),
      name: `Session ${sessions.length + 1}`,
      query: '',
      results: [],
      jobInfo: null,
      createdAt: new Date()
    };
    
    setSessions(prevSessions => [...prevSessions, newSession]);
    setActiveSessionId(newSession.id);
    // Clear current results and job info
    setResults([]);
    setJobInfo(null);
    // Reset to first page
    setCurrentPage(1);
  };
  
  const handleSessionDelete = (sessionId: string) => {
    setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
    
    // If the active session was deleted, set active to the first available session or null
    if (activeSessionId === sessionId) {
      const remainingSessions = sessions.filter(session => session.id !== sessionId);
      if (remainingSessions.length > 0) {
        setActiveSessionId(remainingSessions[0].id);
        // Load the first session data
        setResults(remainingSessions[0].results || []);
        setJobInfo(remainingSessions[0].jobInfo || null);
      } else {
        setActiveSessionId(null);
        // Clear current results and job info
        setResults([]);
        setJobInfo(null);
      }
      // Reset to first page
      setCurrentPage(1);
    }
  };


  // Get current active session
  const activeSession = activeSessionId ? sessions.find(s => s.id === activeSessionId) : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <SessionsPane 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={handleSessionSelect}
        onSessionCreate={handleSessionCreate}
        onSessionDelete={handleSessionDelete}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">

          <main>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-4">Project Settings</h2>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mr-2 w-64">
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
            <div className="flex items-center">
              <label htmlFor="warnSizeBytes" className="block text-sm font-medium text-gray-700 mr-2 w-64">
                Query Size Warning Threshold (bytes):
              </label>
              <input
                type="text"
                id="warnSizeBytes"
                value={warnSizeBytes}
                onChange={(e) => setWarnSizeBytes(e.target.value)}
                className="mt-1 block w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="1073741824"
              />
              <span className="ml-2 text-sm text-gray-500">
                {formatBytes(parseInt(warnSizeBytes) || 0)}
              </span>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showQuerySizeWarning"
                checked={showQuerySizeWarning}
                onChange={(e) => setShowQuerySizeWarning(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showQuerySizeWarning" className="ml-2 block text-sm text-gray-900">
                Always show query size warning dialog
              </label>
            </div>
            <div className="flex items-center">
              <label htmlFor="defaultDataset" className="block text-sm font-medium text-gray-700 mr-2 w-64">
                Default Dataset:
              </label>
              <select
                id="defaultDataset"
                value={defaultDataset?.datasetId || ''}
                onChange={(e) => {
                  if (e.target.value === '') {
                    setDefaultDataset(null);
                  } else {
                    const dataset = availableDatasets.find(ds => ds.id === e.target.value);
                    if (dataset) {
                      setDefaultDataset({
                        datasetId: dataset.id,
                        projectId: dataset.projectId
                      });
                    }
                  }
                }}
                className="mt-1 block w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              >
                <option value="">-- Select Dataset --</option>
                {availableDatasets.map(dataset => (
                  <option key={dataset.id} value={dataset.id}>{dataset.id}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label htmlFor="queryLocation" className="block text-sm font-medium text-gray-700 mr-2 w-64">
                Query Execution Location:
              </label>
              <select
                id="queryLocation"
                value={queryLocation || ''}
                onChange={(e) => setQueryLocation(e.target.value || null)}
                className="mt-1 block w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              >
                <option value="">-- Select Location --</option>
                {locationOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SQL Query</h2>
          <SqlEditor 
            onExecute={handleExecuteQuery} 
            initialValue={activeSession?.query || ''}
          />
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Results</h2>
          <TabView
            tabs={[
              {
                label: 'Job Information',
                content: (
                  <JobInfoTable
                    jobInfo={jobInfo}
                    loading={loading}
                    error={error}
                  />
                )
              },
              {
                label: 'Query Results',
                content: (
                  <ResultsTable 
                    data={results} 
                    loading={loading} 
                    error={error} 
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                  />
                )
              }
            ]}
          />
        </div>
      </main>
        </div>
      </div>
    </div>
  )
}

// Helper function to format bytes to human-readable format
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default App
