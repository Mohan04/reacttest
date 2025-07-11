import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { apiService, type NetworkConfig } from '../services/apiService';
import './NetworkForm.css';

interface NetworkFormData {
  sourceIp: string;
  sourcePort: string;
  destinationIp: string;
  destinationPort: string;
  description: string;
}

const NetworkForm: React.FC = () => {
  const { accounts } = useMsal();
  const [formData, setFormData] = useState<NetworkFormData>({
    sourceIp: '',
    sourcePort: '',
    destinationIp: '',
    destinationPort: '',
    description: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<{ type: 'success' | 'error' | 'info' | null; message: string }>({ type: null, message: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    // Basic IP validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const portRegex = /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;

    if (!ipRegex.test(formData.sourceIp)) {
      alert('Please enter a valid source IP address');
      return false;
    }

    if (!ipRegex.test(formData.destinationIp)) {
      alert('Please enter a valid destination IP address');
      return false;
    }

    if (!portRegex.test(formData.sourcePort)) {
      alert('Please enter a valid source port (1-65535)');
      return false;
    }

    if (!portRegex.test(formData.destinationPort)) {
      alert('Please enter a valid destination port (1-65535)');
      return false;
    }

    if (!formData.description.trim()) {
      alert('Please enter a description');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Check if user is authenticated
    if (accounts.length === 0) {
      setApiStatus({ type: 'error', message: 'Please sign in to submit network configurations' });
      return;
    }

    setIsLoading(true);
    setIsPolling(false);
    setSessionId(null);
    setQueryResult(null);
    setApiStatus({ type: null, message: '' });
    
    try {
      // Get user info for API call
      const userInfo = {
        id: accounts[0].localAccountId,
        email: accounts[0].username
      };

      // Prepare network config data
      const networkConfig: NetworkConfig = {
        sourceIp: formData.sourceIp,
        sourcePort: formData.sourcePort,
        destinationIp: formData.destinationIp,
        destinationPort: formData.destinationPort,
        description: formData.description
      };

      // Step 1: Submit to AWS Lambda and get session ID
      setApiStatus({ type: 'info', message: 'Submitting network query to AWS Lambda...' });
      const submitResponse = await apiService.submitNetworkForm(networkConfig, userInfo);
      
      if (!submitResponse.success) {
        setApiStatus({ type: 'error', message: submitResponse.message });
        return;
      }

      const sessionId = submitResponse.data?.sessionId;
      if (!sessionId) {
        setApiStatus({ type: 'error', message: 'No session ID received from Lambda' });
        return;
      }

      setSessionId(sessionId);
      setApiStatus({ type: 'info', message: `Query submitted successfully. Session ID: ${sessionId}. Polling for results...` });

      // Step 2: Poll for results
      setIsPolling(true);
      const pollResponse = await apiService.pollForResponse(sessionId, userInfo, 10);
      
      if (pollResponse.success) {
        setQueryResult(pollResponse.data);
        setApiStatus({ type: 'success', message: 'Query completed successfully! Results are ready.' });
        
        // Reset form on success
        setFormData({
          sourceIp: '',
          sourcePort: '',
          destinationIp: '',
          destinationPort: '',
          description: ''
        });
      } else {
        setApiStatus({ type: 'error', message: pollResponse.message || 'Failed to get query results' });
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setApiStatus({ type: 'error', message: 'Error submitting form. Please try again.' });
    } finally {
      setIsLoading(false);
      setIsPolling(false);
    }
  };

  return (
    <div className="network-form-container">
      <div className="form-card">
        <h2>Network Configuration</h2>
        <form onSubmit={handleSubmit} className="network-form">
          <div className="form-section">
            <h3>Source Configuration</h3>
            <div className="form-group">
              <label htmlFor="sourceIp">Source IP Address:</label>
              <input
                type="text"
                id="sourceIp"
                name="sourceIp"
                value={formData.sourceIp}
                onChange={handleInputChange}
                placeholder="192.168.1.1"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="sourcePort">Source Port:</label>
              <input
                type="text"
                id="sourcePort"
                name="sourcePort"
                value={formData.sourcePort}
                onChange={handleInputChange}
                placeholder="8080"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Destination Configuration</h3>
            <div className="form-group">
              <label htmlFor="destinationIp">Destination IP Address:</label>
              <input
                type="text"
                id="destinationIp"
                name="destinationIp"
                value={formData.destinationIp}
                onChange={handleInputChange}
                placeholder="10.0.0.1"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="destinationPort">Destination Port:</label>
              <input
                type="text"
                id="destinationPort"
                name="destinationPort"
                value={formData.destinationPort}
                onChange={handleInputChange}
                placeholder="443"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Description</h3>
            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter a description for this network configuration..."
                rows={4}
                required
              />
            </div>
          </div>

          {/* Status Messages */}
          {apiStatus.type && (
            <div className={`status-message ${apiStatus.type}`}>
              {apiStatus.message}
            </div>
          )}

          {/* Session ID Display */}
          {sessionId && (
            <div className="session-info">
              <strong>Session ID:</strong> {sessionId}
            </div>
          )}

          {/* Query Results Display */}
          {queryResult && (
            <div className="query-results">
              <h3>Query Results</h3>
              <pre>{JSON.stringify(queryResult, null, 2)}</pre>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading || isPolling}
            >
              {isLoading ? 'Submitting...' : isPolling ? 'Polling for Results...' : 'Search'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NetworkForm; 