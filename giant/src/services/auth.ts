// Store tokens
let accessToken: string | null = null;

// Get the authentication URL from the backend
export const getAuthUrl = async (): Promise<string> => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/url');
    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error('Error getting auth URL:', error);
    throw error;
  }
};

// Exchange code for tokens
export const exchangeCodeForToken = async (code: string): Promise<void> => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    
    const data = await response.json();
    accessToken = data.tokens.access_token;
    
    // Store the token in localStorage for persistence
    localStorage.setItem('bigquery_access_token', accessToken);
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

// Authenticate user
export const authenticate = async (): Promise<void> => {
  try {
    const authUrl = await getAuthUrl();
    window.open(authUrl, '_blank', 'width=600,height=700');
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Get the access token
export const getAccessToken = (): string | null => {
  // If we have a token in memory, use it
  if (accessToken) {
    return accessToken;
  }
  
  // Otherwise, try to get it from localStorage
  const storedToken = localStorage.getItem('bigquery_access_token');
  if (storedToken) {
    accessToken = storedToken;
  }
  
  return accessToken;
};
