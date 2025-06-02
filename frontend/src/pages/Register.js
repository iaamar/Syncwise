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
  Grid,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Divider,
  CircularProgress,
  LinearProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Username suggestions generator
const generateUsernameSuggestions = (username, email) => {
  const suggestions = [];
  const baseUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
  const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Add original as first suggestion if it's valid
  if (baseUsername.length >= 3) {
    suggestions.push(baseUsername);
  }
  
  // Add email-based suggestion
  if (emailPrefix.length >= 3 && emailPrefix !== baseUsername) {
    suggestions.push(emailPrefix);
  }
  
  // Add numbered variations
  for (let i = 1; i <= 3; i++) {
    suggestions.push(`${baseUsername}${i}`);
    
    // Add with year if it looks like a year (between 1950-2010)
    const year = new Date().getFullYear() - (20 + i * 5);
    if (year >= 1950 && year <= 2010) {
      suggestions.push(`${baseUsername}${year}`);
    }
  }
  
  // Add combined variations
  if (baseUsername.length >= 2 && emailPrefix.length >= 2 && baseUsername !== emailPrefix) {
    suggestions.push(`${baseUsername}${emailPrefix.substring(0, 3)}`);
    suggestions.push(`${emailPrefix.substring(0, 3)}${baseUsername}`);
  }
  
  // Return unique suggestions
  return [...new Set(suggestions)].slice(0, 5);
};

// Password strength component
const PasswordStrengthIndicator = ({ password, strength }) => {
  const getColor = (score) => {
    if (score <= 1) return 'error';
    if (score <= 3) return 'warning';
    return 'success';
  };
  
  const getLabel = (score) => {
    if (score <= 1) return 'Weak';
    if (score <= 3) return 'Good';
    return 'Strong';
  };
  
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color={getColor(strength.score)}>
          {getLabel(strength.score)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {strength.score}/5
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(strength.score / 5) * 100}
        color={getColor(strength.score)}
        sx={{ height: 6, borderRadius: 3 }}
      />
      {strength.feedback && strength.feedback !== 'Password is strong' && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {strength.feedback}
        </Typography>
      )}
    </Box>
  );
};

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: 'Password is required' });
  const { register, registerLoading, checkPasswordStrength, generateSecurePassword } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Steps for the registration process
  const steps = [
    'Account Information',
    'Create Password',
    'Review & Complete',
  ];
  
  // Generate username suggestions when inputs change
  useEffect(() => {
    if (username && email && username.length >= 3 && email.includes('@')) {
      setUsernameLoading(true);
      
      // Simulate network delay for suggestions
      const timer = setTimeout(() => {
        const suggestions = generateUsernameSuggestions(username, email);
        setUsernameSuggestions(suggestions);
        setUsernameLoading(false);
      }, 600);
      
      return () => clearTimeout(timer);
    } else {
      setUsernameSuggestions([]);
    }
  }, [username, email]);
  
  // Check password strength
  useEffect(() => {
    if (password) {
      const strength = checkPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: 'Password is required' });
    }
  }, [password, checkPasswordStrength]);
  
  // Handle username click suggestions
  const handleUsernameSuggestionClick = (suggestion) => {
    setUsername(suggestion);
    setErrors(prev => ({ ...prev, username: '' }));
  };
  
  // Handle form validation
  const validateStep = () => {
    const newErrors = {};
    
    if (activeStep === 0) {
      if (!username.trim()) {
        newErrors.username = 'Username is required';
      } else if (username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }
      
      if (!email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
        newErrors.email = 'Email is invalid';
      }
    } else if (activeStep === 1) {
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (passwordStrength.score < 2) {
        newErrors.password = 'Password is too weak';
      }
      
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };
  
  // Handle back
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Handle generate secure password
  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword();
    setPassword(newPassword);
    setConfirmPassword(newPassword);
    setShowPassword(true);
    setShowConfirmPassword(true);
    
    // Clear password errors
    setErrors(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
    }));
  };
  
  // Handle registration submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeStep !== 2) {
      handleNext();
      return;
    }
    
    setGeneralError('');
    
    try {
      const result = await register(username, email, password);
      
      if (result.success) {
        // Navigate to login with success message
        navigate('/login', {
          state: { 
            message: 'Registration successful! Please log in with your new account.' 
          },
        });
      } else {
        setGeneralError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setGeneralError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
    }
  };

  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
              required
              id="username"
              name="username"
              label="Username"
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) {
                  setErrors(prev => ({ ...prev, username: '' }));
                }
              }}
              error={!!errors.username}
              helperText={errors.username}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            
            {usernameLoading ? (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Checking username availability...
                </Typography>
              </Box>
            ) : (
              usernameSuggestions.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Suggestions:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {usernameSuggestions.map((suggestion) => (
                      <Chip
                        key={suggestion}
                        label={suggestion}
                        size="small"
                        clickable
                        onClick={() => handleUsernameSuggestionClick(suggestion)}
                        sx={{ borderRadius: 1 }}
                      />
                    ))}
                  </Box>
                </Box>
              )
            )}
            
            <TextField
              fullWidth
              margin="normal"
              required
              id="email"
              name="email"
              label="Email Address"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
          </>
        );
      case 1:
        return (
          <>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SecurityIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Create a strong password to secure your account
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleGeneratePassword}
                sx={{ mb: 1 }}
              >
                Generate Secure Password
              </Button>
            </Box>
            
            <TextField
              fullWidth
              margin="normal"
              required
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors(prev => ({ ...prev, password: '' }));
                }
              }}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                sx: { borderRadius: 1 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <PasswordStrengthIndicator 
              password={password} 
              strength={passwordStrength} 
            />
            
            <TextField
              fullWidth
              margin="normal"
              required
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }
              }}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                sx: { borderRadius: 1 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </>
        );
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Please review your information
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Username:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="body2" fontWeight="medium">
                  {username}
                </Typography>
              </Grid>
              
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Email:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="body2" fontWeight="medium">
                  {email}
                </Typography>
              </Grid>
              
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Password:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="body2" fontWeight="medium">
                  {password.replace(/./g, '•')}
                </Typography>
              </Grid>
            </Grid>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              By clicking "Create Account", you agree to our Terms of Service and Privacy Policy.
            </Alert>
          </Box>
        );
      default:
        return 'Unknown step';
    }
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
            Create an Account
          </Typography>
          
          {/* Stepper */}
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'vertical' : 'horizontal'}
            sx={{ width: '100%', mb: 3 }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {/* Alert for general errors */}
          {generalError && (
            <Alert 
              severity="error" 
              sx={{ width: '100%', mb: 2 }}
              onClose={() => setGeneralError('')}
            >
              {generalError}
            </Alert>
          )}
          
          {/* Registration form */}
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            noValidate 
            sx={{ width: '100%' }}
          >
            {getStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ borderRadius: 1 }}
              >
                Back
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                type="submit"
                size="large"
                sx={{ borderRadius: 1 }}
                disabled={registerLoading}
                startIcon={
                  activeStep === 2 
                    ? (registerLoading ? undefined : <PersonAddIcon />)
                    : undefined
                }
              >
                {registerLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  activeStep === steps.length - 1 ? 'Create Account' : 'Next'
                )}
              </Button>
            </Box>
          </Box>
          
          {/* Login link */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: 3,
            }}
          >
            <Typography variant="body2">
              Already have an account?{' '}
              <Link 
                component={RouterLink} 
                to="/login" 
                variant="body2"
                sx={{ fontWeight: 'bold' }}
              >
                Sign In
              </Link>
            </Typography>
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
    </Container>
  );
};

export default Register;