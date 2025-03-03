const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { generateAuthUrl, getToken, getOAuth2Client } = require('./auth');
const { executeQuery } = require('./bigquery');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Authentication endpoints
app.get('/api/auth/url', (req, res) => {
  try {
    const authUrl = generateAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

app.post('/api/auth/token', (req, res) => {
  try {
    const { code } = req.body;
    getToken(code).then(tokens => {
      res.json({ tokens });
    }).catch(error => {
      console.error('Error getting token:', error);
      res.status(500).json({ error: 'Failed to get token' });
    });
  } catch (error) {
    console.error('Error getting token:', error);
    res.status(500).json({ error: 'Failed to get token' });
  }
});

// BigQuery endpoints
app.post('/api/query', (req, res) => {
  try {
    const { query, accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const auth = getOAuth2Client();
    auth.setCredentials({ access_token: accessToken });
    
    executeQuery(query, auth).then(results => {
      res.json({ results });
    }).catch(error => {
      console.error('Error executing query:', error);
      res.status(500).json({ error: 'Failed to execute query' });
    });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Failed to execute query' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
