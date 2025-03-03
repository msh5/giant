import React, { useEffect, useState } from 'react';
import { exchangeCodeForToken } from '../../services/auth';

const OAuthCallback: React.FC = () => {
  const [status, setStatus] = useState<string>('Processing authentication...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code and state from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state) {
          setStatus('Exchanging code for token...');
          await exchangeCodeForToken(code, state);
          
          // Notify the opener window and close this one
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_CALLBACK_SUCCESS' }, '*');
            window.close();
          } else {
            // If no opener, redirect to the main page
            window.location.href = '/';
          }
        } else {
          setError('No authorization code or state found in the URL');
        }
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
        setError('Failed to process authentication');
      }
    };
    
    handleCallback();
  }, []);
  
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <h2 className="text-xl font-semibold mb-4">{status}</h2>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default OAuthCallback;
