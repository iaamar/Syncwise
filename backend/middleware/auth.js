const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Extract user ID from token
const getUserFromToken = (token) => {
  if (!token || !token.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    // Extract the actual token
    const tokenString = token.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
    
    // Return user ID and other claims
    return decoded;
  } catch (err) {
    console.error('Token verification error:', err.message);
    return null;
  }
};

// Context creator function for Apollo Server
const createContext = async ({ req }) => {
  // Get the token from the request headers
  const token = req.headers.authorization || '';
  
  // Validate token and get user data
  const userInfo = getUserFromToken(token);
  
  // Only include minimal necessary user info in context
  if (userInfo && userInfo._id) {
    return { 
      user: userInfo,
      // Don't include the actual User model instance in the context
      // to avoid query execution issues
    };
  }
  
  return { user: null };
};

// Express middleware for protected routes
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const tokenString = token.replace('Bearer ', '');
    const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
    
    // Add minimal user info to request
    req.user = decoded;
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user is authenticated
const isAuthenticated = (user) => {
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
};

module.exports = {
  getUserFromToken,
  createContext,
  authenticate,
  isAuthenticated,
};