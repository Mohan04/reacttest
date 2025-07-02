import React from 'react';
import { useMsal } from '@azure/msal-react';
import './AuthComponent.css';

const AuthComponent: React.FC = () => {
  const { instance, accounts } = useMsal();

  const handleLogout = () => {
    instance.logoutPopup().catch(e => {
      console.error('Logout failed:', e);
    });
  };

  // This component only shows when user is authenticated (ProtectedRoute ensures this)
  return (
    <div className="auth-container">
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
    </div>
  );
};

export default AuthComponent; 