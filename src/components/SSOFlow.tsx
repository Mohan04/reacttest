import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { apiService } from '../services/apiService';
import './SSOFlow.css';

interface NetworkConfig {
  sourceIp: string;
  sourcePort: string;
  destinationIp: string;
  destinationPort: string;
  description: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

const SSOFlow: React.FC = () => {
  const { instance, accounts, isAuthenticated } = useMsal();
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>({
    sourceIp: '',
    sourcePort: '',
    destinationIp: '',
    destinationPort: '',
    description: ''
  });

  const handleLogin = async () => {
    try {
      setLoading(true);
      await instance.loginPopup({
        scopes: ['User.Read']
      });
    } catch (error) {
      console.error('Login failed:', error);
      setApiResponse({
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await instance.logoutPopup();
      setApiResponse(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNetworkConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const callAwsApi = async () => {
    if (!isAuthenticated) {
      setApiResponse({
        success: false,
        message: 'Please login first',
        error: 'Authentication required'
      });
      return;
    }

    try {
      setLoading(true);
      setApiResponse(null);

      // Get access token from MSAL
      const account = instance.getActiveAccount();
      if (!account) {
        throw new Error('No active account found');
      }

      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: account
      });

      console.log('✅ Token acquired successfully');

      // Call AWS API through Python proxy
      const response = await apiService.postNetworkConfig(
        networkConfig,
        tokenResponse.accessToken
      );

      console.log('✅ AWS API call completed');
      setApiResponse(response);

    } catch (error) {
      console.error('❌ AWS API call failed:', error);
      setApiResponse({
        success: false,
        message: 'Failed to call AWS API',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const callLambdaFunction = async () => {
    if (!isAuthenticated) {
      setApiResponse({
        success: false,
        message: 'Please login first',
        error: 'Authentication required'
      });
      return;
    }

    try {
      setLoading(true);
      setApiResponse(null);

      // Get access token from MSAL
      const account = instance.getActiveAccount();
      if (!account) {
        throw new Error('No active account found');
      }

      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: account
      });

      console.log('✅ Token acquired successfully');

      // Call Lambda function through Python proxy
      const response = await apiService.submitNetworkForm(
        networkConfig,
        tokenResponse.accessToken
      );

      console.log('✅ Lambda function call completed');
      setApiResponse(response);

    } catch (error) {
      console.error('❌ Lambda function call failed:', error);
      setApiResponse({
        success: false,
        message: 'Failed to call Lambda function',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserInfo = () => {
    if (!accounts.length) return null;
    const account = accounts[0];
    return {
      name: account.name || 'Unknown User',
      email: account.username || 'unknown@example.com',
      id: account.localAccountId || 'unknown'
    };
  };

  return (
    <div className="sso-flow-container">
      <div className="sso-header">
        <h1>🔐 SSO Flow with Entra ID & AWS</h1>
        <p>Login with Entra ID and call AWS APIs through Python proxy</p>
      </div>

      {/* Authentication Section */}
      <div className="auth-section">
        <h2>🔑 Authentication Status</h2>
        {!isAuthenticated ? (
          <div className="login-prompt">
            <p>Please login with your Entra ID to continue</p>
            <button 
              onClick={handleLogin} 
              disabled={loading}
              className="login-btn"
            >
              {loading ? '🔄 Logging in...' : '🚀 Login with Entra ID'}
            </button>
          </div>
        ) : (
          <div className="user-info">
            <div className="user-details">
              <h3>✅ Authenticated</h3>
              <p><strong>Name:</strong> {getUserInfo()?.name}</p>
              <p><strong>Email:</strong> {getUserInfo()?.email}</p>
              <p><strong>User ID:</strong> {getUserInfo()?.id}</p>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      {/* Network Configuration Form */}
      {isAuthenticated && (
        <div className="config-section">
          <h2>🌐 Network Configuration</h2>
          <div className="config-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sourceIp">Source IP:</label>
                <input
                  type="text"
                  id="sourceIp"
                  name="sourceIp"
                  value={networkConfig.sourceIp}
                  onChange={handleInputChange}
                  placeholder="192.168.1.1"
                />
              </div>
              <div className="form-group">
                <label htmlFor="sourcePort">Source Port:</label>
                <input
                  type="text"
                  id="sourcePort"
                  name="sourcePort"
                  value={networkConfig.sourcePort}
                  onChange={handleInputChange}
                  placeholder="80"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="destinationIp">Destination IP:</label>
                <input
                  type="text"
                  id="destinationIp"
                  name="destinationIp"
                  value={networkConfig.destinationIp}
                  onChange={handleInputChange}
                  placeholder="10.0.0.1"
                />
              </div>
              <div className="form-group">
                <label htmlFor="destinationPort">Destination Port:</label>
                <input
                  type="text"
                  id="destinationPort"
                  name="destinationPort"
                  value={networkConfig.destinationPort}
                  onChange={handleInputChange}
                  placeholder="443"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={networkConfig.description}
                onChange={handleInputChange}
                placeholder="Network configuration description"
                rows={3}
              />
            </div>
          </div>
        </div>
      )}

      {/* API Call Buttons */}
      {isAuthenticated && (
        <div className="api-section">
          <h2>🚀 AWS API Calls</h2>
          <div className="api-buttons">
            <button 
              onClick={callAwsApi} 
              disabled={loading}
              className="api-btn primary"
            >
              {loading ? '🔄 Calling AWS API...' : '📡 Call AWS API'}
            </button>
            <button 
              onClick={callLambdaFunction} 
              disabled={loading}
              className="api-btn secondary"
            >
              {loading ? '🔄 Calling Lambda...' : '⚡ Call Lambda Function'}
            </button>
          </div>
        </div>
      )}

      {/* API Response */}
      {apiResponse && (
        <div className="response-section">
          <h2>📋 API Response</h2>
          <div className={`response-card ${apiResponse.success ? 'success' : 'error'}`}>
            <div className="response-header">
              <span className={`status ${apiResponse.success ? 'success' : 'error'}`}>
                {apiResponse.success ? '✅ Success' : '❌ Error'}
              </span>
              <span className="timestamp">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="response-message">
              <strong>Message:</strong> {apiResponse.message}
            </div>
            {apiResponse.error && (
              <div className="response-error">
                <strong>Error:</strong> {apiResponse.error}
              </div>
            )}
            {apiResponse.data && (
              <div className="response-data">
                <strong>Data:</strong>
                <pre>{JSON.stringify(apiResponse.data, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flow Diagram */}
      <div className="flow-diagram">
        <h2>🔄 Flow Diagram</h2>
        <div className="flow-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>User Login</h4>
              <p>User clicks "Login with Entra ID"</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Entra ID Authentication</h4>
              <p>Azure AD validates credentials</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Get Access Token</h4>
              <p>MSAL acquires JWT token</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Call Python Proxy</h4>
              <p>Send request with token</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h4>Token Validation</h4>
              <p>Proxy validates JWT token</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">6</div>
            <div className="step-content">
              <h4>AWS Service Call</h4>
              <p>Proxy calls AWS with service credentials</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">7</div>
            <div className="step-content">
              <h4>Response to UI</h4>
              <p>Return AWS response to React app</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SSOFlow; 