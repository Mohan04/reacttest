import React, { useState } from 'react';
import './NetworkForm.css';

interface NetworkFormData {
  sourceIp: string;
  sourcePort: string;
  destinationIp: string;
  destinationPort: string;
  description: string;
}

const NetworkForm: React.FC = () => {
  const [formData, setFormData] = useState<NetworkFormData>({
    sourceIp: '',
    sourcePort: '',
    destinationIp: '',
    destinationPort: '',
    description: ''
  });

  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);
    
    try {
      // Here you would typically make an API call to your backend
      console.log('Form submitted with data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Network configuration submitted successfully!');
      
      // Reset form
      setFormData({
        sourceIp: '',
        sourcePort: '',
        destinationIp: '',
        destinationPort: '',
        description: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setIsLoading(false);
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

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NetworkForm; 