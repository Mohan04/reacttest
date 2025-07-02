# API Configuration Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# API Configuration
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_SERVICE_API_KEY=your-service-api-key-here

# Microsoft Entra ID Configuration (optional - can be hardcoded)
VITE_AZURE_CLIENT_ID=4529ea36-d31c-4c2f-8ad8-07f4e91667b6
VITE_AZURE_TENANT_ID=219bf1de-e014-41fb-950d-1f1ea6214410
```

## Backend API Requirements

Your backend API should implement these endpoints:

### POST /api/network-config
**Headers:**
- `Authorization: Bearer {service-api-key}`
- `X-Service-ID: network-config-service`
- `X-User-Context: {user-email}`

**Request Body:**
```json
{
  "sourceIp": "192.168.1.1",
  "sourcePort": "8080",
  "destinationIp": "10.0.0.1",
  "destinationPort": "443",
  "description": "Web server connection",
  "userId": "user-local-account-id",
  "userEmail": "user@company.com",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Network configuration submitted successfully",
  "data": {
    "id": "config-123",
    "status": "processing"
  }
}
```

### GET /api/network-configs
**Headers:**
- `Authorization: Bearer {service-api-key}`
- `X-Service-ID: network-config-service`
- `X-User-Context: {user-email}`

**Query Parameters:**
- `userEmail` (optional): Filter by user email

### GET /api/health
**Headers:**
- `Authorization: Bearer {service-api-key}`
- `X-Service-ID: network-config-service`

## Security Considerations

1. **Service API Key**: Use a strong, randomly generated API key
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Implement rate limiting on your API
4. **Input Validation**: Validate all inputs on the backend
5. **CORS**: Configure CORS to only allow your frontend domain

## Authentication Flow

1. **User Authentication**: User signs in via Microsoft Entra ID SSO
2. **Frontend Validation**: Frontend checks if user is authenticated
3. **API Call**: Frontend makes API call with service credentials
4. **User Context**: User information is passed in headers for audit trail
5. **Backend Processing**: Backend processes request using service authentication

## Example Backend Implementation (Node.js/Express)

```javascript
const express = require('express');
const app = express();

// Middleware to validate service API key
const validateServiceAuth = (req, res, next) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  const serviceId = req.headers['x-service-id'];
  
  if (apiKey !== process.env.SERVICE_API_KEY || serviceId !== 'network-config-service') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// POST network configuration
app.post('/api/network-config', validateServiceAuth, (req, res) => {
  const { sourceIp, sourcePort, destinationIp, destinationPort, description, userEmail } = req.body;
  
  // Process the network configuration
  // Store in database, trigger network operations, etc.
  
  res.json({
    success: true,
    message: 'Network configuration submitted successfully',
    data: {
      id: 'config-' + Date.now(),
      status: 'processing'
    }
  });
});

// GET network configurations
app.get('/api/network-configs', validateServiceAuth, (req, res) => {
  const userEmail = req.query.userEmail;
  
  // Retrieve configurations from database
  // Filter by userEmail if provided
  
  res.json({
    success: true,
    message: 'Network configurations retrieved successfully',
    data: []
  });
});

// Health check
app.get('/api/health', validateServiceAuth, (req, res) => {
  res.json({ status: 'healthy' });
});
``` 