# AWS Gateway Proxy

A Python FastAPI proxy that validates Azure AD (Entra ID) bearer tokens from frontend requests and forwards authenticated requests to AWS API Gateway.

## Architecture

```
Frontend → Python Proxy → AWS API Gateway → AWS Services
    ↓           ↓              ↓              ↓
Azure AD   Token Val.    API Gateway    Lambda/S3/EC2
```

## Features

- **Azure AD Token Validation**: Validates JWT tokens from Azure AD using public keys
- **Request Forwarding**: Forwards authenticated requests to AWS API Gateway
- **User Context**: Adds user information as headers to AWS Gateway requests
- **CORS Support**: Configured for frontend integration
- **Health Check**: Monitors Azure and AWS Gateway connectivity
- **Universal Proxy**: Handles all HTTP methods (GET, POST, PUT, DELETE, PATCH)

## How It Works

1. **Frontend Request**: Frontend sends API request with Azure AD bearer token
2. **Token Validation**: Python proxy validates the token using Azure AD public keys
3. **Request Forwarding**: After successful authentication, forwards the same request to AWS API Gateway
4. **User Context**: Adds user information (ID, email, roles, groups) as headers
5. **Response**: Returns the response from AWS API Gateway back to frontend

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your Azure AD and AWS API Gateway credentials
   ```

3. **Required environment variables**:
   - `AZURE_TENANT_ID`: Your Azure AD tenant ID
   - `AZURE_CLIENT_ID`: Your Azure AD application client ID
   - `AZURE_CLIENT_SECRET`: Your Azure AD application client secret
   - `AWS_API_GATEWAY_URL`: Your AWS API Gateway endpoint URL
   - `AWS_API_KEY`: Your AWS API Gateway API key

4. **Run the proxy**:
   ```bash
   python main.py
   ```

## API Endpoints

### Authentication
All API endpoints require a valid Azure AD bearer token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### Health Check
```
GET /health
```
Returns the health status of Azure and AWS Gateway connections.

### Universal API Proxy
```
GET /api/{path}
POST /api/{path}
PUT /api/{path}
DELETE /api/{path}
PATCH /api/{path}
```
All requests to `/api/*` are forwarded to AWS API Gateway after token validation.

### User Profile
```
GET /api/user/profile
```
Get information about the authenticated user (handled locally, not forwarded).

## Request Flow Example

1. **Frontend Request**:
   ```javascript
   fetch('/api/network-config', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer <azure-ad-token>',
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({ sourceIp: '192.168.1.1' })
   })
   ```

2. **Python Proxy Processing**:
   - Validates Azure AD token
   - Extracts user information
   - Forwards to: `{AWS_API_GATEWAY_URL}/network-config`

3. **AWS Gateway Request**:
   ```http
   POST /network-config
   Authorization: Bearer <aws-api-key>
   X-User-ID: user-guid
   X-User-Email: user@example.com
   X-User-Roles: admin,user
   Content-Type: application/json
   
   {"sourceIp": "192.168.1.1"}
   ```

## User Context Headers

The proxy adds the following headers to AWS Gateway requests:

- `X-User-ID`: Azure AD user ID
- `X-User-Email`: User email address
- `X-User-Roles`: Comma-separated list of user roles
- `X-User-Groups`: Comma-separated list of user groups
- `X-Tenant-ID`: Azure AD tenant ID

## Response Format

All endpoints return JSON responses in the following format:

```json
{
  "success": true,
  "status_code": 200,
  "data": {
    // Response from AWS API Gateway
  },
  "user": {
    "user_id": "user-guid",
    "email": "user@example.com",
    "name": "User Name",
    "roles": ["role1", "role2"],
    "groups": ["group1", "group2"],
    "tenant_id": "tenant-guid"
  }
}
```

## Error Handling

- **401 Unauthorized**: Invalid or missing bearer token
- **502 Bad Gateway**: AWS API Gateway connection error
- **504 Gateway Timeout**: AWS API Gateway timeout
- **500 Internal Server Error**: Other errors

## Docker Support

Build and run with Docker:

```bash
docker build -t aws-gateway-proxy .
docker run -p 8000:8000 --env-file .env aws-gateway-proxy
```

Or use Docker Compose:

```bash
docker-compose up
```

## Development

The proxy runs on `http://localhost:8000` by default. You can access the interactive API documentation at `http://localhost:8000/docs`.

## AWS API Gateway Setup

1. **Create API Gateway**: Set up REST API or HTTP API
2. **Configure Routes**: Set up routes that match your frontend API paths
3. **Add API Key**: Create and configure API key for authentication
4. **Integrate Backend**: Connect to Lambda functions, S3, or other AWS services
5. **Deploy**: Deploy to a stage (e.g., `prod`, `dev`)

## Security Considerations

1. **Token Validation**: All tokens are validated against Azure AD public keys
2. **API Key**: AWS API Gateway uses API key for authentication
3. **User Context**: User information is securely forwarded as headers
4. **CORS**: Configured to only allow specific origins
5. **Logging**: Comprehensive logging for debugging and monitoring 