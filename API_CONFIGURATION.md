# API Configuration Guide

## Environment Variables

To configure the AWS Lambda integration, you need to set the following environment variables:

### Required Environment Variables

1. **VITE_LAMBDA_URL**: The URL of your AWS Lambda function
   ```
   VITE_LAMBDA_URL=https://your-lambda-function-url.lambda-url.region.on.aws
   ```

2. **VITE_SERVICE_API_KEY**: Your service API key for authentication
   ```
   VITE_SERVICE_API_KEY=your-service-api-key
   ```

3. **VITE_API_BASE_URL**: Your main API base URL (for legacy endpoints)
   ```
   VITE_API_BASE_URL=https://your-api-domain.com/api
   ```

## AWS Lambda Function Requirements

Your AWS Lambda function should handle the following:

### POST Request (Submit Network Query)
- **Endpoint**: `POST /`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer {api-key}`
  - `X-Service-ID: network-query-service`
  - `X-User-Context: {user-email}`

- **Request Body**:
  ```json
  {
    "sourceIp": "192.168.1.1",
    "sourcePort": "8080",
    "destinationIp": "10.0.0.1",
    "destinationPort": "443",
    "description": "Network query description",
    "userId": "user-id",
    "userEmail": "user@example.com",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "action": "submit_network_query"
  }
  ```

- **Response**:
  ```json
  {
    "sessionId": "unique-session-id",
    "status": "processing",
    "message": "Query submitted successfully"
  }
  ```

### GET Request (Query Response)
- **Endpoint**: `GET /query`
- **Headers**:
  - `Authorization: Bearer {api-key}`
  - `X-Service-ID: network-query-service`
  - `X-User-Context: {user-email}`
  - `X-Session-ID: {session-id}`

- **Response**:
  ```json
  {
    "status": "completed",
    "result": {
      "networkAnalysis": "Analysis results here",
      "recommendations": "Security recommendations",
      "riskScore": 85
    },
    "completed": true,
    "error": null
  }
  ```

## Implementation Notes

1. **Session Management**: The Lambda function should generate a unique session ID for each query submission and store the query state.

2. **Polling**: The frontend will poll the `/query` endpoint until the response is completed or an error occurs.

3. **Authentication**: Use the provided API key for service-to-service authentication.

4. **Error Handling**: Return appropriate HTTP status codes and error messages for different failure scenarios.

## Example Lambda Function Structure

```javascript
exports.handler = async (event) => {
  const { httpMethod, path, headers, body } = event;
  
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Service-ID,X-User-Context,X-Session-ID',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  };
  
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  // Validate API key
  const apiKey = headers.Authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.SERVICE_API_KEY) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }
  
  if (httpMethod === 'POST') {
    // Handle network query submission
    const sessionId = generateSessionId();
    // Store query in database/cache
    // Start processing...
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        sessionId: sessionId,
        status: 'processing',
        message: 'Query submitted successfully'
      })
    };
  }
  
  if (httpMethod === 'GET' && path === '/query') {
    const sessionId = headers['X-Session-ID'];
    // Retrieve query status and results
    // Return appropriate response
  }
};
```

## Security Considerations

1. **API Key Management**: Store API keys securely and rotate them regularly.
2. **Input Validation**: Validate all input parameters on the Lambda function.
3. **Rate Limiting**: Implement rate limiting to prevent abuse.
4. **Logging**: Log all requests for monitoring and debugging.
5. **Error Handling**: Don't expose sensitive information in error messages. 