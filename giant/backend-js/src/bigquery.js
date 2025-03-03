const { BigQuery } = require('@google-cloud/bigquery');

let bigQueryClient = null;

const initBigQuery = (auth) => {
  if (!bigQueryClient) {
    bigQueryClient = new BigQuery({
      projectId: 'YOUR_PROJECT_ID',
      authClient: auth,
    });
  }
  return bigQueryClient;
};

const executeQuery = async (query, auth) => {
  const client = initBigQuery(auth);
  
  try {
    const [rows] = await client.query(query);
    return rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

module.exports = {
  initBigQuery,
  executeQuery
};
