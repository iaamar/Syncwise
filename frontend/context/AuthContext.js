import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useApolloClient, gql } from '@apollo/client';

// GraphQL queries and mutations
const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        _id
        username
        email
        profilePicture
        status
      }
    }
  }
`;

const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterInput!) {
    registerUser(input: $input) {
      _id
      username
      email
      profilePicture
    }
  }
`;

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      _id
      username
      email
      profilePicture
      status
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateUserProfile($profilePicture: String, $status: String) {
    updateUserProfile(profilePicture: $profilePicture, status: $status) {
      _id
      username
      email
      profilePicture
      status
    }
  }
`;

const UPDATE_PASSWORD = gql`
  mutation UpdateUserPassword($currentPassword: String!, $newPassword: String!) {
    updateUserPassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

// Create context
const AuthContext = createContext();

// Helper function to parse JWT without external dependencies
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const [mediaPermissions, setMediaPermissions] = useState({
    audio: false,
    video: false,
  });
  const [deviceSettings, setDeviceSettings] = useState({
    audioInput: localStorage.getItem('preferredAudioInput'),
    audioOutput: localStorage.getItem('preferredAudioOutput'),
    videoInput: localStorage.getItem('preferredVideoInput'),
  });
  const client = useApolloClient();

  // Login mutation
  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN);

  // Register mutation
  const [registerMutation, { loading: registerLoading }] = useMutation(REGISTER_USER);

  // Update profile mutation
  const [updateProfileMutation] = useMutation(UPDATE_PROFILE);

  // Update password mutation
  const [updatePasswordMutation] = useMutation(UPDATE_PASSWORD);

  // Check token validity
  const isTokenValid = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const decoded = parseJwt(token);
      if (!decoded || !decoded.exp) return false;
      
      // Check if token is expired
      return decoded.exp * 1000 > Date.now();
    } catch (err) {
      console.error('Invalid token:', err);
      return false;
    }
  }, []);

  // Get current user query with proper error handling
  const { data: userData, loading: userLoading, error: userError } = useQuery(GET_CURRENT_USER, {
    skip: !localStorage.getItem('token') || !isTokenValid(),
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error('Error fetching current user:', error);
      // If token is invalid, clear it
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  });

  // Update authentication state when userData changes
  useEffect(() => {
    if (!userLoading) {
      if (userData && userData.me) {
        setUser(userData.me);
        setIsAuthenticated(true);
        initializeSessionTimeout();
      } else {
        // Clear token if user data is not available
        if (localStorage.getItem('token') && (userError || !isTokenValid())) {
          localStorage.removeItem('token');
        }
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    }
  }, [userData, userLoading, userError, isTokenValid]);

  // Initialize session timeout
  const initializeSessionTimeout = () => {
    setLastActivity(Date.now());
    setSessionTimeout(null);
  };

  // Session timeout management
  useEffect(() => {
    // Track user activity
    const handleActivity = () => {
      setLastActivity(Date.now());
      if (sessionTimeout) {
        setSessionTimeout(null);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [sessionTimeout]);

  // Check for inactivity
  useEffect(() => {
    if (isAuthenticated) {
      const checkInactivity = setInterval(() => {
        const now = Date.now();
        const inactiveTime = now - lastActivity;
        
        // If inactive for more than 30 minutes, log out
        if (inactiveTime > 30 * 60 * 1000) {
          logout();
          clearInterval(checkInactivity);
        } else if (inactiveTime > 25 * 60 * 1000 && !sessionTimeout) {
          // Show timeout warning at 25 minutes
          setSessionTimeout({
            expiresAt: lastActivity + 30 * 60 * 1000,
            timeLeft: 5 * 60 * 1000,
          });
        }
      }, 60 * 1000); // Check every minute

      return () => clearInterval(checkInactivity);
    }
  }, [isAuthenticated, lastActivity, sessionTimeout]);

  // Update session timeout countdown
  useEffect(() => {
    if (sessionTimeout) {
      const updateCountdown = setInterval(() => {
        const timeLeft = sessionTimeout.expiresAt - Date.now();
        
        if (timeLeft <= 0) {
          clearInterval(updateCountdown);
          setSessionTimeout(null);
          logout();
        } else {
          setSessionTimeout(prev => ({
            ...prev,
            timeLeft,
          }));
        }
      }, 1000);

      return () => clearInterval(updateCountdown);
    }
  }, [sessionTimeout]);

  // Extend session
  const extendSession = () => {
    initializeSessionTimeout();
  };

  // Generate a secure password
  const generateSecurePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
    const length = 12;
    let password = '';
    
    // Ensure at least one character from each category
    password += chars.substring(0, 26).charAt(Math.floor(Math.random() * 26)); // lowercase
    password += chars.substring(26, 52).charAt(Math.floor(Math.random() * 26)); // uppercase
    password += chars.substring(52, 62).charAt(Math.floor(Math.random() * 10)); // number
    password += chars.substring(62).charAt(Math.floor(Math.random() * (chars.length - 62))); // special
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };

  // Check password strength
  const checkPasswordStrength = (password) => {
    if (!password) return { score: 0, feedback: 'Password is required' };
    
    let score = 0;
    const feedback = [];
    
    // Length check
    if (password.length < 8) {
      feedback.push('Password should be at least 8 characters long');
    } else {
      score += password.length > 12 ? 2 : 1;
    }
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');
    
    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');
    
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1;
    else feedback.push('Include special characters');
    
    // Repetition check
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('Avoid repeated characters');
    }
    
    // Common patterns check
    const commonPatterns = ['123', 'abc', 'qwerty', 'password', 'admin'];
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      score -= 1;
      feedback.push('Avoid common patterns');
    }
    
    return {
      score: Math.max(0, Math.min(5, score)),
      feedback: feedback.join(', ') || 'Password is strong',
    };
  };

  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      const { data } = await loginMutation({
        variables: { email, password },
      });
      
      // Save token and user data
      const token = data.login.token;
      localStorage.setItem('token', token);
      
      // Save login credentials if rememberMe is true
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      setUser(data.login.user);
      setIsAuthenticated(true);
      initializeSessionTimeout();
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide a more user-friendly error message
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.message.includes('not found')) {
        errorMessage = 'Account not found. Please check your email or sign up.';
      } else if (error.message.includes('incorrect')) {
        errorMessage = 'Incorrect password. Please try again.';
      }
      
      return { 
        success: false,
        error: errorMessage
      };
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      const { data } = await registerMutation({
        variables: {
          input: {
            username,
            email,
            password,
          },
        },
      });
      
      return { 
        success: true,
        user: data.registerUser
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Provide a more user-friendly error message
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message.includes('already exists')) {
        if (error.message.includes('username')) {
          errorMessage = 'Username is already taken. Please choose another one.';
        } else if (error.message.includes('email')) {
          errorMessage = 'Email is already registered. Please use another email or login.';
        }
      }
      
      return { 
        success: false,
        error: errorMessage
      };
    }
  };
  
  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const { data } = await updateProfileMutation({
        variables: profileData,
      });
      
      setUser(data.updateUserProfile);
      
      return { 
        success: true,
        user: data.updateUserProfile
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false,
        error: error.message || 'Failed to update profile.'
      };
    }
  };
  
  // Update password function
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const { data } = await updatePasswordMutation({
        variables: { currentPassword, newPassword },
      });
      
      return { 
        success: data.updateUserPassword,
      };
    } catch (error) {
      console.error('Update password error:', error);
      
      // Provide a more user-friendly error message
      let errorMessage = 'Failed to update password.';
      
      if (error.message.includes('incorrect')) {
        errorMessage = 'Current password is incorrect. Please try again.';
      }
      
      return { 
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      // Clear token and state
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setSessionTimeout(null);
      
      // Reset Apollo store
      await client.resetStore();
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  // Get remembered email
  const getRememberedEmail = () => {
    return localStorage.getItem('rememberedEmail') || '';
  };

  // Request media permissions
  const requestMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      
      // Stop tracks after permission check
      stream.getTracks().forEach(track => track.stop());
      
      setMediaPermissions({ audio: true, video: true });
      return true;
    } catch (error) {
      console.error('Media permission error:', error);
      setMediaPermissions({
        audio: error.name === 'NotAllowedError' ? false : error.constraints?.audio || false,
        video: error.name === 'NotAllowedError' ? false : error.constraints?.video || false,
      });
      return false;
    }
  };

  // Get available devices
  const getAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        audioInputs: devices.filter(d => d.kind === 'audioinput'),
        audioOutputs: devices.filter(d => d.kind === 'audiooutput'),
        videoInputs: devices.filter(d => d.kind === 'videoinput'),
      };
    } catch (error) {
      console.error('Error getting devices:', error);
      return { audioInputs: [], audioOutputs: [], videoInputs: [] };
    }
  };

  // Update device settings
  const updateDeviceSettings = (settings) => {
    const newSettings = { ...deviceSettings, ...settings };
    setDeviceSettings(newSettings);
    
    // Save to localStorage
    if (settings.audioInput) localStorage.setItem('preferredAudioInput', settings.audioInput);
    if (settings.audioOutput) localStorage.setItem('preferredAudioOutput', settings.audioOutput);
    if (settings.videoInput) localStorage.setItem('preferredVideoInput', settings.videoInput);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        loginLoading,
        registerLoading,
        sessionTimeout,
        mediaPermissions,
        deviceSettings,
        login,
        register,
        logout,
        extendSession,
        updateProfile,
        updatePassword,
        requestMediaPermissions,
        updateDeviceSettings,
        getAvailableDevices,
        generateSecurePassword,
        checkPasswordStrength,
        getRememberedEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);