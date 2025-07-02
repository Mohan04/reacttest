interface NetworkConfig {
  sourceIp: string;
  sourcePort: string;
  destinationIp: string;
  destinationPort: string;
  description: string;
  userId?: string; // Optional: include user context
  userEmail?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

class ApiService {
  private baseUrl: string;
  private serviceApiKey: string;

  constructor() {
    // In production, these would come from environment variables
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://your-api-domain.com/api';
    this.serviceApiKey = import.meta.env.VITE_SERVICE_API_KEY || 'your-service-api-key';
  }

  /**
   * Post network configuration to backend
   * Uses service authentication but only if user is logged in
   */
  async postNetworkConfig(config: NetworkConfig, userInfo?: { id?: string; email?: string }): Promise<ApiResponse> {
    try {
      // Add user context if available
      const payload = {
        ...config,
        userId: userInfo?.id,
        userEmail: userInfo?.email,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${this.baseUrl}/network-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceApiKey}`,
          'X-Service-ID': 'network-config-service',
          'X-User-Context': userInfo?.email || 'anonymous'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Network configuration submitted successfully',
        data
      };

    } catch (error) {
      console.error('API call failed:', error);
      return {
        success: false,
        message: 'Failed to submit network configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get network configurations (if needed)
   */
  async getNetworkConfigs(userEmail?: string): Promise<ApiResponse> {
    try {
      const url = userEmail 
        ? `${this.baseUrl}/network-configs?userEmail=${encodeURIComponent(userEmail)}`
        : `${this.baseUrl}/network-configs`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.serviceApiKey}`,
          'X-Service-ID': 'network-config-service',
          'X-User-Context': userEmail || 'anonymous'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Network configurations retrieved successfully',
        data
      };

    } catch (error) {
      console.error('API call failed:', error);
      return {
        success: false,
        message: 'Failed to retrieve network configurations',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Health check for API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.serviceApiKey}`,
          'X-Service-ID': 'network-config-service'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
export type { NetworkConfig, ApiResponse }; 