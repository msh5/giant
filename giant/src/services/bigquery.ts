import { getAccessToken } from './auth';

export const executeQuery = async (query: string): Promise<any[]> => {
  try {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch('http://localhost:3001/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, accessToken }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data.results;
    } else {
      throw new Error(data.error || 'Failed to execute query');
    }
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};
