const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

// Use environment variables if available, otherwise use empty strings
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5173/oauth-callback';
const SCOPES = ['https://www.googleapis.com/auth/bigquery'];

let oAuth2Client = null;

const getOAuth2Client = () => {
  if (!oAuth2Client) {
    oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  }
  return oAuth2Client;
};

const generateAuthUrl = () => {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    include_granted_scopes: true
  });
};

const getToken = async (code) => {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  return tokens;
};

module.exports = {
  getOAuth2Client,
  generateAuthUrl,
  getToken
};
