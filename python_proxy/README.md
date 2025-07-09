# AWS Proxy API

A Python FastAPI application that acts as a proxy between your React UI and AWS services. It validates Azure AD tokens and forwards authenticated requests to AWS using service account credentials.

## Features

- **Azure AD Token Validation**: Validates JWT tokens from Azure AD
- **AWS Service Integration**: Supports Lambda, S3, EC2, and CloudWatch
- **User Context Forwarding**: Adds user information to AWS requests
- **CORS Support**: Configured for React development
- **Health Checks**: Built-in health monitoring
- **Comprehensive Logging**: Detailed request/response logging

## Architecture

```
React UI → Python Proxy → AWS Services
    ↓           ↓           ↓
Azure AD   Token Val.   Service Account
```

## Setup

### 1. Install Dependencies

```bash
cd python_proxy
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```env
# Azure AD Configuration
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_SESSION_TOKEN=your-aws-session-token  # Optional

# Proxy Configuration
PROXY_HOST=0.0.0.0
PROXY_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# JWT Configuration
JWT_ALGORITHMS=RS256
JWT_ISSUER=https://login.microsoftonline.com/your-tenant-id/v2.0
```

### 3. Run the Application

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### Health Check
- `GET /health` - Check service health and connectivity

### Network Configuration
- `POST /api/network-config` - Create network configuration

### AWS Lambda
- `POST /api/lambda/invoke` - Invoke Lambda functions

### AWS S3
- `GET /api/s3/buckets` - List S3 buckets
- `POST /api/s3/objects` - List objects in a bucket

### AWS EC2
- `POST /api/ec2/instances` - List EC2 instances

### AWS CloudWatch
- `POST /api/cloudwatch/metrics` - Get CloudWatch metrics

### User Profile
- `GET /api/user/profile` - Get current user information

## Authentication

All API endpoints (except `/health`) require a valid Azure AD JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Integration with React App

Update your React app's `apiService.ts` to use the Python proxy:

```typescript
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'http://localhost:8000/api';
  }

  async postNetworkConfig(config: NetworkConfig, userInfo?: { id?: string; email?: string }): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/network-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAccessToken()}`, // Get from MSAL
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      return {
        success: false,
        message: 'Failed to submit network configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async getAccessToken(): Promise<string> {
    // Get access token from MSAL
    const account = msalInstance.getActiveAccount();
    if (!account) {
      throw new Error('No active account');
    }

    const response = await msalInstance.acquireTokenSilent({
      scopes: ['User.Read'],
      account: account
    });

    return response.accessToken;
  }
}
```

## Security Considerations

1. **Token Validation**: All tokens are validated against Azure AD public keys
2. **User Context**: User information is extracted and forwarded to AWS
3. **CORS**: Configured to only allow specific origins
4. **Error Handling**: Sensitive information is not exposed in error messages
5. **Logging**: Comprehensive logging for debugging and monitoring

## AWS Service Account Setup

1. Create an IAM user or role with appropriate permissions
2. Generate access keys for the user/role
3. Configure the credentials in your `.env` file
4. Ensure the service account has permissions for the AWS services you need

### Example IAM Policy

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
                "cloudwatch:GetMetricStatistics"
            ],
            "Resource": "*"
        }
    ]
}
```

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Code Structure

```
python_proxy/
├── main.py          # FastAPI application
├── auth.py          # Azure AD token validation
├── aws_client.py    # AWS service integration
├── config.py        # Configuration management
├── models.py        # Pydantic models
├── requirements.txt # Python dependencies
├── env.example      # Environment variables template
└── README.md        # This file
```

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

For production, set these environment variables:

- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `CORS_ORIGINS`

## Troubleshooting

### Common Issues

1. **Token Validation Fails**: Check Azure AD configuration and ensure the token is valid
2. **AWS Connection Fails**: Verify AWS credentials and permissions
3. **CORS Errors**: Update `CORS_ORIGINS` in your environment variables
4. **Port Already in Use**: Change `PROXY_PORT` in your environment variables

### Logs

The application logs all requests and errors. Check the console output for debugging information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 