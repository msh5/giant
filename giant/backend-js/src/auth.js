// Direct Google OAuth implementation
require('dotenv').config();

// Constants for Google OAuth
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5173/oauth-callback';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = ['https://www.googleapis.com/auth/bigquery'];

// Generate a random state for CSRF protection
const generateState = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Store state for verification
let currentState = null;

// Generate the authentication URL
const generateAuthUrl = () => {
  currentState = generateState();
  
  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
    state: currentState,
    prompt: 'consent',
    access_type: 'offline',
    include_granted_scopes: 'true'
  });
  
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

// Verify the state parameter to prevent CSRF attacks
const verifyState = (state) => {
  return state === currentState;
};

// This function would normally exchange the code for tokens
// In this simplified implementation, we'll just return the code
// which the frontend can use directly with Google's APIs
const getToken = async (code, state) => {
  if (!verifyState(state)) {
    throw new Error('Invalid state parameter');
  }
  
  return { code };
};

// Create a mock OAuth client for compatibility with existing code
const getOAuth2Client = () => {
  return {
    setCredentials: () => {},
    credentials: {}
  };
};

module.exports = {
  getOAuth2Client,
  generateAuthUrl,
  getToken,
  verifyState
};
