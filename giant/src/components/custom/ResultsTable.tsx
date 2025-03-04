import React from 'react';

interface ResultsTableProps {
  data: any[];
  loading: boolean;
  error: string | null;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ data, loading, error }) => {
  if (loading) {
    return <div className="flex justify-center items-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-gray-500 p-4">No results to display</div>;
  }

  // Get column headers from the first row
  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            {columns.map((column) => (
              <th key={column} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map((column) => (
                <td key={`${rowIndex}-${column}`} className="px-4 py-2 border-b border-gray-200">
                  {row[column] !== null && row[column] !== undefined ? String(row[column]) : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
