import React, { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/authConfig';
import './ProtectedRoute.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { accounts, instance } = useMsal();
  const [isAttemptingSilentAuth, setIsAttemptingSilentAuth] = useState(false);

  // Attempt silent authentication on component mount
  useEffect(() => {
    if (accounts.length === 0 && !isAttemptingSilentAuth) {
      setIsAttemptingSilentAuth(true);
      
      // Try silent authentication first (for corporate networks)
      instance.ssoSilent(loginRequest)
        .then(response => {
          console.log('Silent authentication successful');
        })
        .catch(error => {
          console.log('Silent authentication failed, user will need to login manually');
        })
        .finally(() => {
          setIsAttemptingSilentAuth(false);
        });
    }
  }, [instance, accounts.length, isAttemptingSilentAuth]);

  // Show loading state while attempting silent authentication
  if (isAttemptingSilentAuth) {
    return (
      <div className="protected-route-container">
        <div className="login-overlay">
          <div className="login-card">
            <div className="login-content">
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
              <div className="login-description">
                <h3>Authenticating...</h3>
                <p>Attempting automatic sign-in with your organization account</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show login screen
  if (accounts.length === 0) {
    return (
      <div className="protected-route-container">
        <div className="login-overlay">
          <div className="login-card">
            <div className="login-header">
              <h2>🔒 Access Required</h2>
              <p>You need to sign in to access this application</p>
            </div>
            
            <div className="login-content">
              <div className="security-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
              </div>
              
              <div className="login-description">
                <h3>Network Configuration Tool</h3>
                <p>This application requires Microsoft Entra ID authentication to access network configuration features.</p>
              </div>
              
              <button 
                onClick={() => instance.loginPopup(loginRequest)}
                className="login-button"
              >
                <svg className="ms-logo" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2L2 7V17L10 22L18 17V7L10 2Z" fill="currentColor"/>
                </svg>
                Sign in with Microsoft
              </button>
              
              <div className="login-footer">
                <p>🔐 Secure authentication via your organization's Microsoft account</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the protected content
  return <>{children}</>;
};

export default ProtectedRoute; 