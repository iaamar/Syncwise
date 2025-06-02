const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { AuthenticationError, UserInputError } = require('apollo-server-express');

module.exports = {
  Query: {
    me: async (_, __, { user }) => {
      // Check if user exists in context
      if (!user || !user._id) {
        throw new AuthenticationError('Not authenticated');
      }
      
      try {
        // Use findById instead of findOne to avoid re-execution issues
        const currentUser = await User.findById(user._id).exec();
        return currentUser;
      } catch (error) {
        console.error('Error fetching current user:', error);
        throw new Error('Failed to fetch user data');
      }
    },
    
    getUser: async (_, { id }, { user }) => {
      if (!user || !user._id) {
        throw new AuthenticationError('Not authenticated');
      }
      
      try {
        const foundUser = await User.findById(id).exec();
        
        if (!foundUser) {
          throw new Error('User not found');
        }
        
        return foundUser;
      } catch (error) {
        console.error('Error fetching user:', error);
        throw new Error('Failed to fetch user data');
      }
    },
    
    searchUsers: async (_, { query }, { user }) => {
      if (!user || !user._id) {
        throw new AuthenticationError('Not authenticated');
      }
      
      try {
        return await User.find({
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
        }).exec();
      } catch (error) {
        console.error('Error searching users:', error);
        throw new Error('Failed to search users');
      }
    },
  },
  
  Mutation: {
    registerUser: async (_, { input }) => {
      const { username, email, password } = input;
      
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [{ email }, { username }] 
        }).exec();
        
        if (existingUser) {
          if (existingUser.email === email) {
            throw new UserInputError('Email is already registered');
          }
          throw new UserInputError('Username is already taken');
        }
        
        // Create new user
        const user = new User({
          username,
          email,
          passwordHash: password, // Will be hashed by pre-save hook
        });
        
        const savedUser = await user.save();
        return savedUser;
      } catch (error) {
        console.error('Registration error:', error);
        
        // Forward the UserInputError
        if (error instanceof UserInputError) {
          throw error;
        }
        
        throw new Error(`Error creating user: ${error.message}`);
      }
    },
    
    login: async (_, { email, password }) => {
      try {
        // Find user
        const user = await User.findOne({ email }).exec();
        
        if (!user) {
          throw new UserInputError('Invalid email or password');
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
          throw new UserInputError('Invalid email or password');
        }
        
        // Update status
        user.status = 'online';
        await user.save();
        
        // Generate token
        const token = user.generateToken();
        
        return {
          token,
          user,
        };
      } catch (error) {
        console.error('Login error:', error);
        
        // Forward the UserInputError
        if (error instanceof UserInputError) {
          throw error;
        }
        
        throw new Error('Login failed. Please try again.');
      }
    },
    
    updateUserProfile: async (_, { profilePicture, status }, { user }) => {
      if (!user || !user._id) {
        throw new AuthenticationError('Not authenticated');
      }
      
      try {
        const userToUpdate = await User.findById(user._id).exec();
        
        if (!userToUpdate) {
          throw new Error('User not found');
        }
        
        // Update only provided fields
        if (profilePicture !== undefined) {
          userToUpdate.profilePicture = profilePicture;
        }
        
        if (status !== undefined) {
          userToUpdate.status = status;
        }
        
        const updatedUser = await userToUpdate.save();
        return updatedUser;
      } catch (error) {
        console.error('Update profile error:', error);
        throw new Error(`Error updating profile: ${error.message}`);
      }
    },
    
    updateUserPassword: async (_, { currentPassword, newPassword }, { user }) => {
      if (!user || !user._id) {
        throw new AuthenticationError('Not authenticated');
      }
      
      try {
        const userToUpdate = await User.findById(user._id).exec();
        
        if (!userToUpdate) {
          throw new Error('User not found');
        }
        
        // Check current password
        const isMatch = await userToUpdate.comparePassword(currentPassword);
        
        if (!isMatch) {
          throw new UserInputError('Current password is incorrect');
        }
        
        // Update password
        userToUpdate.passwordHash = newPassword;
        await userToUpdate.save();
        
        return true;
      } catch (error) {
        console.error('Update password error:', error);
        
        // Forward the UserInputError
        if (error instanceof UserInputError) {
          throw error;
        }
        
        throw new Error(`Error updating password: ${error.message}`);
      }
    },
  },
};