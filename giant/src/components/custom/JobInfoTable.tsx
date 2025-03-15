import React from 'react';

interface JobInfoTableProps {
  jobInfo: any;
  loading: boolean;
  error: string | null;
}

const JobInfoTable: React.FC<JobInfoTableProps> = ({ 
  jobInfo, 
  loading, 
  error 
}) => {
  if (loading) {
    return <div className="flex justify-center items-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!jobInfo) {
    return <div className="text-gray-500 p-4">No job information to display</div>;
  }

  // Extract relevant job information
  const jobDetails = [
    { label: 'Job ID', value: jobInfo.jobReference?.jobId || 'N/A' },
    { label: 'Project ID', value: jobInfo.jobReference?.projectId || 'N/A' },
    { label: 'Location', value: jobInfo.jobReference?.location || 'N/A' },
    { label: 'Creation Time', value: jobInfo.statistics?.creationTime ? new Date(parseInt(jobInfo.statistics.creationTime)).toLocaleString() : 'N/A' },
    { label: 'Start Time', value: jobInfo.statistics?.startTime ? new Date(parseInt(jobInfo.statistics.startTime)).toLocaleString() : 'N/A' },
    { label: 'End Time', value: jobInfo.statistics?.endTime ? new Date(parseInt(jobInfo.statistics.endTime)).toLocaleString() : 'N/A' },
    { label: 'Total Bytes Processed', value: jobInfo.statistics?.totalBytesProcessed ? formatBytes(parseInt(jobInfo.statistics.totalBytesProcessed)) : 'N/A' },
    { label: 'Billing Tier', value: jobInfo.statistics?.query?.billingTier || 'N/A' },
    { label: 'Cache Hit', value: jobInfo.statistics?.query?.cacheHit ? 'Yes' : 'No' },
    { label: 'Statement Type', value: jobInfo.statistics?.query?.statementType || 'N/A' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Property</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Value</th>
          </tr>
        </thead>
        <tbody>
          {jobDetails.map((detail, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2 border-b border-gray-200 font-medium">{detail.label}</td>
              <td className="px-4 py-2 border-b border-gray-200">{detail.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper function to format bytes to human-readable format
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default JobInfoTable;
