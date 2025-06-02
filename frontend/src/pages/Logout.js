import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  CircularProgress,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Logout = () => {
  const { logout, isAuthenticated, isLoading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const performLogout = async () => {
      try {
        if (isAuthenticated) {
          await logout();
        }
        setLoggingOut(false);
      } catch (error) {
        console.error('Error during logout:', error);
        setLoggingOut(false);
      }
    };

    performLogout();
  }, [logout, isAuthenticated]);

  const handleGoToHome = () => {
    navigate('/');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  if (isLoading || loggingOut) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          p: 2
        }}
      >
        <CircularProgress size={40} sx={{ mb: 3 }} />
        <Typography variant="h6">Logging you out...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
        p: 2
      }}
    >
      {/* Background Pattern */}
      <Box 
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(63,81,181,0.1) 0%, rgba(245,0,87,0.05) 70%, rgba(0,0,0,0) 100%)',
          zIndex: 0,
        }}
      />
      <Box 
        sx={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,0,87,0.1) 0%, rgba(63,81,181,0.05) 70%, rgba(0,0,0,0) 100%)',
          zIndex: 0,
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* App branding */}
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: '4px', 
              background: 'linear-gradient(90deg, #3f51b5 0%, #f50057 100%)' 
            }} 
          />
          
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              mb: 2, 
              color: 'primary.main',
              fontWeight: 'bold', 
            }}
          >
            SyncWise
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
            You've been logged out
          </Typography>

          <Typography 
            variant="body1" 
            align="center" 
            color="text.secondary" 
            paragraph
            sx={{ mb: 4 }}
          >
            Thank you for using SyncWise. You have been successfully logged out of your account. 
            We hope to see you again soon!
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, width: '100%', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleGoToHome}
              size="large"
              sx={{ 
                minWidth: 150,
                borderRadius: 1,
              }}
            >
              Go to Home
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGoToLogin}
              size="large"
              sx={{ 
                minWidth: 150,
                borderRadius: 1,
              }}
            >
              Log In Again
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Logout;