import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/authConfig';
import './AuthDemo.css';

const AuthDemo: React.FC = () => {
  const { instance, accounts } = useMsal();
  const [authMethod, setAuthMethod] = useState<string>('');
  const [authResult, setAuthResult] = useState<string>('');

  // Method 1: Popup Authentication (Current)
  const handlePopupLogin = async () => {
    setAuthMethod('Popup');
    setAuthResult('Opening Azure AD popup...');
    
    try {
      const response = await instance.loginPopup(loginRequest);
      setAuthResult(`✅ Popup login successful! Welcome, ${response.account?.name}`);
    } catch (error) {
      setAuthResult(`❌ Popup login failed: ${error}`);
    }
  };

  // Method 2: Redirect Authentication
  const handleRedirectLogin = () => {
    setAuthMethod('Redirect');
    setAuthResult('Redirecting to Azure AD...');
    instance.loginRedirect(loginRequest);
  };

  // Method 3: Silent Authentication (SSO)
  const handleSilentLogin = async () => {
    setAuthMethod('Silent SSO');
    setAuthResult('Attempting silent authentication...');
    
    try {
      const response = await instance.ssoSilent(loginRequest);
      setAuthResult(`✅ Silent SSO successful! Welcome, ${response.account?.name}`);
    } catch (error) {
      setAuthResult(`❌ Silent SSO failed: ${error}. User needs to login manually.`);
    }
  };

  // Method 4: Custom Login Page (if you wanted one)
  const handleCustomLogin = () => {
    setAuthMethod('Custom Page');
    setAuthResult('This would show your custom login form (not recommended for production)');
  };

  const handleLogout = () => {
    instance.logoutPopup().catch(e => {
      console.error('Logout failed:', e);
    });
  };

  return (
    <div className="auth-demo-container">
      <div className="auth-demo-card">
        <h2>🔐 Azure AD Authentication Methods</h2>
        
        <div className="auth-status">
          <h3>Current Status:</h3>
          {accounts.length > 0 ? (
            <div className="authenticated">
              ✅ <strong>Authenticated as:</strong> {accounts[0].name}
              <br />
              📧 Email: {accounts[0].username}
              <button onClick={handleLogout} className="logout-btn">Sign Out</button>
            </div>
          ) : (
            <div className="not-authenticated">
              ❌ <strong>Not authenticated</strong>
            </div>
          )}
        </div>

        <div className="auth-methods">
          <h3>Authentication Methods:</h3>
          
          <div className="method-grid">
            <div className="method-card">
              <h4>1. Popup Authentication (Current)</h4>
              <p>Opens Azure AD login in a popup window</p>
              <ul>
                <li>✅ User stays on your page</li>
                <li>✅ No page redirect</li>
                <li>⚠️ Popup blockers might interfere</li>
              </ul>
              <button onClick={handlePopupLogin} className="method-btn popup">
                Try Popup Login
              </button>
            </div>

            <div className="method-card">
              <h4>2. Redirect Authentication</h4>
              <p>Redirects entire page to Azure AD</p>
              <ul>
                <li>✅ Works everywhere</li>
                <li>✅ No popup blockers</li>
                <li>⚠️ User leaves your page temporarily</li>
              </ul>
              <button onClick={handleRedirectLogin} className="method-btn redirect">
                Try Redirect Login
              </button>
            </div>

            <div className="method-card">
              <h4>3. Silent SSO</h4>
              <p>Attempts automatic login (corporate networks)</p>
              <ul>
                <li>✅ Seamless experience</li>
                <li>✅ No user interaction needed</li>
                <li>⚠️ Only works if already logged in</li>
              </ul>
              <button onClick={handleSilentLogin} className="method-btn silent">
                Try Silent SSO
              </button>
            </div>

            <div className="method-card">
              <h4>4. Custom Login Page</h4>
              <p>Your own login form (not recommended)</p>
              <ul>
                <li>❌ Security risks</li>
                <li>❌ More maintenance</li>
                <li>❌ Lose SSO benefits</li>
              </ul>
              <button onClick={handleCustomLogin} className="method-btn custom" disabled>
                Custom Login (Disabled)
              </button>
            </div>
          </div>
        </div>

        {authMethod && (
          <div className="auth-result">
            <h3>Last Action: {authMethod}</h3>
            <div className="result-message">{authResult}</div>
          </div>
        )}

        <div className="auth-explanation">
          <h3>🤔 Why Use Azure AD's Login Page?</h3>
          <div className="explanation-grid">
            <div className="explanation-item">
              <h4>🔒 Security</h4>
              <p>Credentials never touch your application. Azure AD handles all security.</p>
            </div>
            <div className="explanation-item">
              <h4>🏢 Enterprise Features</h4>
              <p>MFA, conditional access, password policies handled automatically.</p>
            </div>
            <div className="explanation-item">
              <h4>🔄 SSO Integration</h4>
              <p>Users can use existing corporate accounts without re-entering credentials.</p>
            </div>
            <div className="explanation-item">
              <h4>📱 Multi-Platform</h4>
              <p>Works on web, mobile, desktop with consistent experience.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDemo; 