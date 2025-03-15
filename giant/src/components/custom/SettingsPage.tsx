import React from 'react';

interface SettingsPageProps {
  warnSizeBytes: string;
  setWarnSizeBytes: (size: string) => void;
  showQuerySizeWarning: boolean;
  setShowQuerySizeWarning: (show: boolean) => void;
  defaultDataset: { datasetId: string, projectId?: string } | null;
  setDefaultDataset: (dataset: { datasetId: string, projectId?: string } | null) => void;
  availableDatasets: Array<{ id: string, projectId: string, location: string }>;
  queryLocation: string | null;
  setQueryLocation: (location: string | null) => void;
  locationOptions: Array<{ value: string, label: string }>;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  warnSizeBytes,
  setWarnSizeBytes,
  showQuerySizeWarning,
  setShowQuerySizeWarning,
  defaultDataset,
  setDefaultDataset,
  availableDatasets,
  queryLocation,
  setQueryLocation,
  locationOptions
}) => {
  // Helper function to format bytes to human-readable format
  const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Project Settings section removed as requested */}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Query Settings</h2>
        <div className="flex flex-col space-y-4">
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
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Dataset & Location Settings</h2>
        <div className="flex flex-col space-y-4">
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
    </div>
  );
};

export default SettingsPage;
