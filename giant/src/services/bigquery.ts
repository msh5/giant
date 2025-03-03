import { BigQuery } from '@google-cloud/bigquery';

let bigQueryClient: BigQuery | null = null;

export const initBigQuery = (): BigQuery => {
  if (!bigQueryClient) {
    bigQueryClient = new BigQuery({
      projectId: 'YOUR_PROJECT_ID',
      // In a real application, you would use the access token from the OAuth flow
      credentials: {
        client_email: 'client_email',
        private_key: 'private_key',
      },
    });
  }
  return bigQueryClient;
};

export const executeQuery = async (query: string): Promise<any[]> => {
  const client = initBigQuery();
  
  try {
    const [rows] = await client.query(query);
    return rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};
