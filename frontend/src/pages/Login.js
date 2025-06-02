import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  LockOpen as LockOpenIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Intelligent login timeout estimator
const getLoginTimeoutMessage = () => {
  const date = new Date();
  const hour = date.getHours();
  
  // Custom messages based on time of day
  if (hour >= 6 && hour < 12) {
    return "Good morning! ☕ Sessions automatically close after 30 minutes of inactivity.";
  } else if (hour >= 12 && hour < 18) {
    return "Good afternoon! 🌤 Sessions automatically close after 30 minutes of inactivity.";
  } else {
    return "Good evening! 🌙 Sessions automatically close after 30 minutes of inactivity.";
  }
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timeoutMessage] = useState(getLoginTimeoutMessage());
  const [sessionTimeoutDialog, setSessionTimeoutDialog] = useState(false);
  const { login, isLoading, loginLoading, getRememberedEmail, sessionTimeout, logout, extendSession } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Initialize form with remembered email
  useEffect(() => {
    const rememberedEmail = getRememberedEmail();
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, [getRememberedEmail]);
  
  // Check for message passed from other components (e.g., Registration)
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location.state]);
  
  // Handle session timeout dialog visibility
  useEffect(() => {
    if (sessionTimeout) {
      setSessionTimeoutDialog(true);
    } else {
      setSessionTimeoutDialog(false);
    }
  }, [sessionTimeout]);

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Simple validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    // Implement login
    try {
      const result = await login(email, password, rememberMe);
      
      if (result.success) {
        // Redirect to dashboard or appropriate page
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle "Remember Me" toggle
  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
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
            component="h1" 
            variant="h4" 
            sx={{ 
              mb: 3, 
              color: 'primary.main',
              fontWeight: 'bold',
            }}
          >
            SyncWise
          </Typography>
          
          <Typography 
            component="h2" 
            variant="h5" 
            sx={{ mb: 2 }}
          >
            Sign In
          </Typography>
          
          {/* Alert messages */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ width: '100%', mb: 2 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          
          {successMessage && (
            <Alert 
              severity="success" 
              sx={{ width: '100%', mb: 2 }}
              onClose={() => setSuccessMessage('')}
            >
              {successMessage}
            </Alert>
          )}
          
          {/* Login form */}
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            noValidate 
            sx={{ width: '100%' }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus={!getRememberedEmail()}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!error && error.toLowerCase().includes('email')}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!error && error.toLowerCase().includes('password')}
              InputProps={{
                sx: { borderRadius: 1 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    value="remember" 
                    color="primary" 
                    checked={rememberMe}
                    onChange={handleRememberMeChange}
                  />
                }
                label="Remember me"
              />
              
              <Link 
                component={RouterLink}
                to="/forgot-password" 
                variant="body2"
                sx={{ ml: 1 }}
              >
                Forgot password?
              </Link>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ 
                mt: 3, 
                mb: 2,
                height: 48,
                borderRadius: 1,
                boxShadow: 2,
              }}
              disabled={isLoading || loginLoading}
              startIcon={loginLoading ? undefined : <LoginIcon />}
            >
              {loginLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
            
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mt: 2,
              }}
            >
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link 
                  component={RouterLink} 
                  to="/register" 
                  variant="body2"
                  sx={{ fontWeight: 'bold' }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>
            
            <Divider sx={{ mt: 3, mb: 2 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
              <Typography 
                variant="caption" 
                color="text.secondary" 
                align="center"
              >
                {timeoutMessage}
              </Typography>
            </Box>
          </Box>
        </Paper>
        
        {/* Footer */}
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ mt: 3, textAlign: 'center' }}
        >
          &copy; {new Date().getFullYear()} SyncWise. All rights reserved.
        </Typography>
      </Box>
      
      {/* Session timeout dialog */}
      <Dialog
        open={sessionTimeoutDialog}
        aria-labelledby="session-timeout-dialog-title"
      >
        <DialogTitle id="session-timeout-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LockOpenIcon color="warning" sx={{ mr: 1 }} />
            Session About to Expire
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Your session is about to expire due to inactivity. You will be logged out in{' '}
            {sessionTimeout ? Math.floor(sessionTimeout.timeLeft / 60000) : 5} minutes.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Would you like to continue your session?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => logout()} color="inherit">
            Logout Now
          </Button>
          <Button onClick={() => extendSession()} color="primary" variant="contained" autoFocus>
            Extend Session
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login;