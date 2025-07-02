# Network Configuration Tool

A React application that allows users to enter source and destination IP addresses, ports, and descriptions with Microsoft Entra ID (Azure AD) Single Sign-On integration.

## Features

- **Microsoft Entra ID SSO**: Secure authentication using Microsoft accounts
- **Page Protection**: Complete application protection - unauthenticated users cannot access any content
- **Silent Authentication**: Automatic sign-in on corporate networks (federated SSO)
- **Network Configuration Form**: Input fields for source/destination IP and port
- **Form Validation**: Client-side validation for IP addresses and ports
- **Modern UI**: Beautiful, responsive design with animations
- **TypeScript**: Full TypeScript support for better development experience

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Microsoft Azure account with Entra ID (Azure AD)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd react-app1
npm install
```

### 2. Microsoft Entra ID Configuration

#### Step 1: Register your application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: Network Configuration Tool
   - **Supported account types**: Choose based on your needs (Single tenant, Multi-tenant, etc.)
   - **Redirect URI**: 
     - Type: Single-page application (SPA)
     - URI: `http://localhost:5173` (for development)
5. Click **Register**

#### Step 2: Get Application Details

1. From the app registration overview, copy the **Application (client) ID**
2. Copy the **Directory (tenant) ID**

#### Step 3: Configure Authentication

1. In your app registration, go to **Authentication**
2. Add platform: **Single-page application**
3. Add redirect URI: `http://localhost:5173`
4. Enable **Access tokens** and **ID tokens** under implicit grant and hybrid flows

### 3. Update Configuration

Edit `src/config/authConfig.ts` and replace the placeholder values:

```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: "YOUR_CLIENT_ID_HERE", // Replace with your actual client ID
    authority: "https://login.microsoftonline.com/YOUR_TENANT_ID_HERE", // Replace with your tenant ID
    redirectUri: window.location.origin,
  },
  // ... rest of config
};
```

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

1. **Access Control**: The application is completely protected - users must authenticate to access any content
2. **Authentication**: 
   - **Corporate Network**: Automatic silent authentication via federated SSO
   - **External/Manual**: Click "Sign in with Microsoft" to authenticate
3. **Form Input**: Fill in the network configuration form:
   - Source IP Address (e.g., 192.168.1.1)
   - Source Port (e.g., 8080)
   - Destination IP Address (e.g., 10.0.0.1)
   - Destination Port (e.g., 443)
   - Description (e.g., "Web server connection")
4. **Submit**: Click the "Search" button to submit the configuration

## Project Structure

```
src/
├── components/
│   ├── ProtectedRoute.tsx     # Page protection wrapper
│   ├── ProtectedRoute.css     # Protection screen styling
│   ├── AuthComponent.tsx      # User info and logout
│   ├── AuthComponent.css      # Auth component styling
│   ├── NetworkForm.tsx        # Main form component
│   └── NetworkForm.css        # Form styling
├── services/
│   └── apiService.ts          # API service with authentication
├── config/
│   └── authConfig.ts          # MSAL configuration
├── App.tsx                    # Main application component
├── App.css                    # Global styles
└── main.tsx                   # Application entry point
```

## Technologies Used

- **React 19**: Latest React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **MSAL.js**: Microsoft Authentication Library
- **CSS3**: Modern styling with animations

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

For production deployment, you may want to use environment variables:

```bash
# .env.local
VITE_AZURE_CLIENT_ID=your_client_id
VITE_AZURE_TENANT_ID=your_tenant_id
```

Then update `authConfig.ts`:

```typescript
clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Add environment variables in Netlify dashboard
4. Deploy

### Azure Static Web Apps

1. Push your code to GitHub
2. Create Static Web App in Azure Portal
3. Connect your repository
4. Configure authentication settings
5. Deploy

## Security Considerations

- Never commit sensitive configuration to version control
- Use environment variables for production deployments
- Implement proper CORS policies on your backend
- Consider implementing additional security measures like API key validation

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure your Azure AD app registration is configured correctly
2. **CORS Issues**: Add your domain to the allowed origins in Azure AD
3. **Redirect URI Mismatch**: Ensure the redirect URI in Azure AD matches your application URL

### Debug Mode

Enable debug logging by adding to `authConfig.ts`:

```typescript
system: {
  loggerOptions: {
    loggerCallback: (level, message, containsPii) => {
      if (containsPii) {
        return;
      }
      switch (level) {
        case LogLevel.Error:
          console.error(message);
          return;
        case LogLevel.Info:
          console.info(message);
          return;
        case LogLevel.Verbose:
          console.debug(message);
          return;
        case LogLevel.Warning:
          console.warn(message);
          return;
      }
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
