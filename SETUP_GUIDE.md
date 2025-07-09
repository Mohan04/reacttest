# Complete Setup Guide: React UI + Python Proxy + AWS

This guide will help you set up the complete system with a React frontend, Python proxy for token validation, and AWS backend services.

## Architecture Overview

```
React UI (Port 5173) → Python Proxy (Port 8000) → AWS Services
    ↓                        ↓                        ↓
Azure AD Login        Token Validation         Service Account
```

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Python** (3.8 or higher)
3. **AWS Account** with appropriate permissions
4. **Azure AD App Registration**

## Step 1: Azure AD Setup

### 1.1 Create Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Fill in the details:
   - **Name**: Your app name (e.g., "React AWS Proxy")
   - **Supported account types**: Choose based on your needs
   - **Redirect URI**: `http://localhost:5173` (for development)
5. Click "Register"

### 1.2 Configure Authentication

1. In your app registration, go to "Authentication"
2. Add platform: "Single-page application (SPA)"
3. Add redirect URI: `http://localhost:5173`
4. Enable "Access tokens" and "ID tokens"
5. Save changes

### 1.3 Get Application Credentials

1. Go to "Overview" and copy:
   - **Application (client) ID**
   - **Directory (tenant) ID**
2. Go to "Certificates & secrets" → "New client secret"
3. Copy the secret value (you won't see it again)

## Step 2: AWS Setup

### 2.1 Create IAM User/Role

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create a new IAM user or role
3. Attach the following policy (or create a custom one):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction",
                "s3:ListBucket",
                "s3:GetObject",
                "ec2:DescribeInstances",
                "cloudwatch:GetMetricStatistics",
                "sts:GetCallerIdentity"
            ],
            "Resource": "*"
        }
    ]
}
```

### 2.2 Generate Access Keys

1. For the IAM user, go to "Security credentials"
2. Create access key
3. Copy the Access Key ID and Secret Access Key

## Step 3: Python Proxy Setup

### 3.1 Navigate to Python Proxy Directory

```bash
cd python_proxy
```

### 3.2 Install Dependencies

```bash
pip install -r requirements.txt
```

### 3.3 Configure Environment Variables

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```env
# Azure AD Configuration
AZURE_TENANT_ID=your-tenant-id-from-azure
AZURE_CLIENT_ID=your-client-id-from-azure
AZURE_CLIENT_SECRET=your-client-secret-from-azure

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_SESSION_TOKEN=  # Leave empty for permanent credentials

# Proxy Configuration
PROXY_HOST=0.0.0.0
PROXY_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# JWT Configuration
JWT_ALGORITHMS=RS256
JWT_ISSUER=https://login.microsoftonline.com/your-tenant-id/v2.0
```

### 3.4 Start the Python Proxy

```bash
# Option 1: Using the startup script
./start.sh

# Option 2: Using Python directly
python main.py

# Option 3: Using uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The proxy will be available at: http://localhost:8000

## Step 4: React App Setup

### 4.1 Configure Azure AD in React App

Edit `src/config/authConfig.ts`:

```typescript
import type { Configuration, PopupRequest } from "@azure/msal-browser";

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: "your-client-id-from-azure", // Replace with your actual client ID
    authority: "https://login.microsoftonline.com/your-tenant-id", // Replace with your tenant ID
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: PopupRequest = {
  scopes: ["User.Read"]
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};
```

### 4.2 Install React Dependencies

```bash
# From the root directory
npm install
```

### 4.3 Start the React App

```bash
npm run dev
```

The React app will be available at: http://localhost:5173

## Step 5: Testing the Integration

### 5.1 Test Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "aws_connected": true,
  "azure_configured": true
}
```

### 5.2 Test Authentication Flow

1. Open http://localhost:5173 in your browser
2. Click "Sign In" 
3. Complete Azure AD authentication
4. You should see your user information displayed

### 5.3 Test API Calls

1. After authentication, try submitting a network configuration
2. Check the browser's Network tab to see the API calls
3. Verify that requests are going to the Python proxy (port 8000)

## Step 6: Using the API

### 6.1 Network Configuration

```typescript
// In your React component
import { useMsal } from '@azure/msal-react';
import { apiService } from '../services/apiService';

const MyComponent = () => {
  const { instance } = useMsal();

  const handleSubmit = async () => {
    try {
      // Get access token
      const account = instance.getActiveAccount();
      const response = await instance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: account
      });

      // Submit network config
      const result = await apiService.postNetworkConfig(
        {
          sourceIp: "192.168.1.1",
          sourcePort: "80",
          destinationIp: "10.0.0.1",
          destinationPort: "443",
          description: "Test configuration"
        },
        response.accessToken
      );

      console.log('Result:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <button onClick={handleSubmit}>Submit Network Config</button>
  );
};
```

### 6.2 Lambda Function Invocation

```typescript
const invokeLambda = async () => {
  try {
    const account = instance.getActiveAccount();
    const response = await instance.acquireTokenSilent({
      scopes: ['User.Read'],
      account: account
    });

    const result = await apiService.submitNetworkForm(
      {
        sourceIp: "192.168.1.1",
        sourcePort: "80",
        destinationIp: "10.0.0.1",
        destinationPort: "443",
        description: "Test configuration"
      },
      response.accessToken
    );

    console.log('Lambda result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `CORS_ORIGINS` in `.env` includes your React app URL
   - Check that the Python proxy is running on the correct port

2. **Token Validation Fails**
   - Verify Azure AD configuration in both React app and Python proxy
   - Check that the tenant ID and client ID match
   - Ensure the client secret is correct

3. **AWS Connection Fails**
   - Verify AWS credentials in `.env`
   - Check IAM permissions
   - Ensure the AWS region is correct

4. **React App Won't Start**
   - Check that all dependencies are installed: `npm install`
   - Verify Node.js version: `node --version`
   - Check for TypeScript errors: `npm run lint`

### Debug Mode

To enable debug logging in the Python proxy, add to `.env`:

```env
LOG_LEVEL=DEBUG
```

### Health Check Endpoints

- Python Proxy: http://localhost:8000/health
- React App: http://localhost:5173 (should show login page)

## Production Deployment

### Docker Deployment

1. Build the Python proxy:
```bash
cd python_proxy
docker build -t aws-proxy .
```

2. Run with environment variables:
```bash
docker run -p 8000:8000 \
  -e AZURE_TENANT_ID=your-tenant-id \
  -e AZURE_CLIENT_ID=your-client-id \
  -e AZURE_CLIENT_SECRET=your-client-secret \
  -e AWS_ACCESS_KEY_ID=your-aws-key \
  -e AWS_SECRET_ACCESS_KEY=your-aws-secret \
  aws-proxy
```

### Environment Variables for Production

Set these environment variables in your production environment:

```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
CORS_ORIGINS=https://yourdomain.com
```

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use environment variables for all sensitive data**
3. **Implement proper CORS policies**
4. **Use HTTPS in production**
5. **Regularly rotate AWS access keys**
6. **Monitor API usage and logs**
7. **Implement rate limiting for production**

## Next Steps

1. **Add more AWS services** (DynamoDB, SQS, etc.)
2. **Implement caching** (Redis)
3. **Add monitoring and logging** (CloudWatch, ELK stack)
4. **Set up CI/CD pipelines**
5. **Add unit and integration tests**
6. **Implement user role-based access control**

## Support

If you encounter issues:

1. Check the logs in both React app and Python proxy
2. Verify all environment variables are set correctly
3. Test each component individually
4. Check the browser's Network tab for API call details
5. Use the health check endpoints to verify connectivity 