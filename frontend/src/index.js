import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import theme from './theme';
import { ApolloProvider } from '@apollo/client';
import { client } from './apollo/client';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import GlobalStyles from './GlobalStyles';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles />
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <WorkspaceProvider>
                <App />
              </WorkspaceProvider>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ApolloProvider>
  </React.StrictMode>
);