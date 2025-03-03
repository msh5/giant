import React, { useEffect } from 'react';
import { exchangeCodeForToken } from '../../services/auth';

const OAuthCallback: React.FC = () => {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
          await exchangeCodeForToken(code);
          window.opener.postMessage({ type: 'OAUTH_CALLBACK_SUCCESS' }, '*');
          window.close();
        }
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
      }
    };
    
    handleCallback();
  }, []);
  
  return (
    <div className="flex justify-center items-center h-screen">
      <p>Processing authentication, please wait...</p>
    </div>
  );
};

export default OAuthCallback;
