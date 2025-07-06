import React from 'react';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './config/authConfig';
import ProtectedRoute from './components/ProtectedRoute';
import AuthComponent from './components/AuthComponent';
import NetworkForm from './components/NetworkForm';

import './App.css';

// Initialize MSAL
const msalInstance = new PublicClientApplication(msalConfig);

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <div className="App">
        <ProtectedRoute>
          <AuthComponent />
          <NetworkForm />
        
        </ProtectedRoute>
      </div>
    </MsalProvider>
  );
}

export default App;
