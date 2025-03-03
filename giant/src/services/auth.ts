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
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

// Authenticate user
export const authenticate = async (): Promise<void> => {
  try {
    const authUrl = await getAuthUrl();
    
    // Open the auth URL in a new window
    window.open(authUrl, '_blank');
    
    // In a real application, you would handle the redirect and code exchange
    // For now, we'll simulate getting a token
    return new Promise((resolve) => {
      // This is a placeholder. In a real app, you would get the code from the redirect URL
      setTimeout(() => {
        accessToken = 'simulated_access_token';
        resolve();
      }, 5000);
    });
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Get the access token
export const getAccessToken = (): string | null => {
  return accessToken;
};
