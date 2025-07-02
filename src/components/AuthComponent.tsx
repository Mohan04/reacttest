import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/authConfig';
import './AuthComponent.css';

const AuthComponent: React.FC = () => {
  const { instance, accounts } = useMsal();

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
      console.error('Login failed:', e);
    });
  };

  const handleLogout = () => {
    instance.logoutPopup().catch(e => {
      console.error('Logout failed:', e);
    });
  };

  return (
    <div className="auth-container">
      {accounts.length === 0 ? (
        <div className="auth-section">
          <h3>Welcome to Network Configuration Tool</h3>
          <p>Please sign in with your Microsoft account to continue</p>
          <button onClick={handleLogin} className="login-btn">
            <svg className="ms-logo" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2L2 7V17L10 22L18 17V7L10 2Z" fill="currentColor"/>
            </svg>
            Sign in with Microsoft
          </button>
        </div>
      ) : (
        <div className="auth-section">
          <div className="user-info">
            <div className="user-avatar">
              {accounts[0].name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <h4>Welcome, {accounts[0].name || 'User'}!</h4>
              <p>{accounts[0].username}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthComponent; 