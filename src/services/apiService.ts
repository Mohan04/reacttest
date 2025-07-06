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

interface LambdaSessionResponse {
  sessionId: string;
  status: string;
  message?: string;
}

interface QueryResponse {
  status: string;
  result?: any;
  error?: string;
  completed: boolean;
}

class ApiService {
  private baseUrl: string;
  private serviceApiKey: string;
  private lambdaUrl: string;

  constructor() {
    // In production, these would come from environment variables
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://your-api-domain.com/api';
    this.serviceApiKey = import.meta.env.VITE_SERVICE_API_KEY || 'your-service-api-key';
    this.lambdaUrl = import.meta.env.VITE_LAMBDA_URL || 'https://your-lambda-function-url.lambda-url.region.on.aws';
  }

  /**
   * Submit network form to AWS Lambda and get session ID
   */
  async submitNetworkForm(config: NetworkConfig, userInfo?: { id?: string; email?: string }): Promise<ApiResponse> {
    try {
      // Prepare payload for Lambda
      const payload = {
        ...config,
        userId: userInfo?.id,
        userEmail: userInfo?.email,
        timestamp: new Date().toISOString(),
        action: 'submit_network_query'
      };

      const response = await fetch(this.lambdaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceApiKey}`,
          'X-Service-ID': 'network-query-service',
          'X-User-Context': userInfo?.email || 'anonymous'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LambdaSessionResponse = await response.json();
      
      if (data.sessionId) {
        return {
          success: true,
          message: 'Network query submitted successfully. Session ID received.',
          data: { sessionId: data.sessionId, status: data.status }
        };
      } else {
        throw new Error(data.message || 'No session ID received from Lambda');
      }

    } catch (error) {
      console.error('Lambda API call failed:', error);
      return {
        success: false,
        message: 'Failed to submit network query to Lambda',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Query response from AWS Lambda using session ID
   */
  async queryResponse(sessionId: string, userInfo?: { id?: string; email?: string }): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.lambdaUrl}/query`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.serviceApiKey}`,
          'X-Service-ID': 'network-query-service',
          'X-User-Context': userInfo?.email || 'anonymous',
          'X-Session-ID': sessionId
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: QueryResponse = await response.json();
      
      return {
        success: true,
        message: data.completed ? 'Query completed successfully' : 'Query in progress',
        data: {
          status: data.status,
          result: data.result,
          completed: data.completed,
          error: data.error
        }
      };

    } catch (error) {
      console.error('Query API call failed:', error);
      return {
        success: false,
        message: 'Failed to query response from Lambda',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Poll for response completion with session ID
   */
  async pollForResponse(sessionId: string, userInfo?: { id?: string; email?: string }, maxAttempts: number = 10): Promise<ApiResponse> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await this.queryResponse(sessionId, userInfo);
      
      if (!response.success) {
        return response;
      }

      const data = response.data as QueryResponse;
      
      if (data.completed) {
        return {
          success: true,
          message: 'Query completed successfully',
          data: data.result
        };
      }

      if (data.error) {
        return {
          success: false,
          message: 'Query failed',
          error: data.error
        };
      }

      // Wait before next attempt (exponential backoff)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return {
      success: false,
      message: 'Query timeout - maximum attempts reached',
      error: 'Timeout'
    };
  }

  /**
   * Post network configuration to backend (legacy method)
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
export type { NetworkConfig, ApiResponse, LambdaSessionResponse, QueryResponse }; 