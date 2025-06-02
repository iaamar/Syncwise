const Message = require('../../models/Message');
const User = require('../../models/User');
const Channel = require('../../models/Channel');
const { isAuthenticated } = require('../../middleware/auth');

module.exports = {
  Query: {
    getChannelMessages: async (_, { channelId, limit = 50, offset = 0 }, { user }) => {
      isAuthenticated(user);
      
      // Check if channel exists and user has access
      const channel = await Channel.findById(channelId);
      
      if (!channel) {
        throw new Error('Channel not found');
      }
      
      if (channel.type === 'private' && !channel.members.includes(user._id)) {
        throw new Error('Not authorized to access this channel');
      }
      
      // Get messages
      const messages = await Message.find({ channelId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('sender')
        .sort({ createdAt: 1 });
      
      return messages;
    },
    
    getMessage: async (_, { id }, { user }) => {
      isAuthenticated(user);
      
      const message = await Message.findById(id).populate('sender');
      
      if (!message) {
        throw new Error('Message not found');
      }
      
      return message;
    },
    
    getThreadMessages: async (_, { threadId }, { user }) => {
      isAuthenticated(user);
      
      const messages = await Message.find({ threadId })
        .populate('sender')
        .sort({ createdAt: 1 });
      
      return messages;
    },
  },
  
  Mutation: {
    sendMessage: async (_, { input }, { user }) => {
      isAuthenticated(user);
      
      const { channelId, content, attachments = [], threadId = null } = input;
      
      // Check if channel exists and user has access
      const channel = await Channel.findById(channelId);
      
      if (!channel) {
        throw new Error('Channel not found');
      }
      
      if (channel.type === 'private' && !channel.members.includes(user._id)) {
        throw new Error('Not authorized to send messages to this channel');
      }
      
      // Create message
      const message = new Message({
        channelId,
        sender: user._id,
        content,
        attachments,
        threadId,
        readBy: [user._id],
      });
      
      await message.save();
      await message.populate('sender');
      
      return message;
    },
    
    updateMessage: async (_, { id, content }, { user }) => {
      isAuthenticated(user);
      
      const message = await Message.findById(id);
      
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Check if user is the sender
      if (message.sender.toString() !== user._id.toString()) {
        throw new Error('Not authorized to update this message');
      }
      
      // Update message
      message.content = content;
      await message.save();
      await message.populate('sender');
      
      return message;
    },
    
    deleteMessage: async (_, { id }, { user }) => {
      isAuthenticated(user);
      
      const message = await Message.findById(id);
      
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Check if user is the sender
      if (message.sender.toString() !== user._id.toString()) {
        throw new Error('Not authorized to delete this message');
      }
      
      await Message.findByIdAndDelete(id);
      
      return true;
    },
    
    addReaction: async (_, { messageId, emoji }, { user }) => {
      isAuthenticated(user);
      
      const message = await Message.findById(messageId);
      
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Check if user already reacted with this emoji
      const reactionIndex = message.reactions.findIndex(
        (reaction) => reaction.emoji === emoji
      );
      
      if (reactionIndex !== -1) {
        // Check if user already added this reaction
        if (message.reactions[reactionIndex].users.includes(user._id)) {
          // Remove user from reaction
          message.reactions[reactionIndex].users = message.reactions[reactionIndex].users.filter(
            (userId) => userId.toString() !== user._id.toString()
          );
          
          // Remove reaction if no users left
          if (message.reactions[reactionIndex].users.length === 0) {
            message.reactions.splice(reactionIndex, 1);
          }
        } else {
          // Add user to reaction
          message.reactions[reactionIndex].users.push(user._id);
        }
      } else {
        // Add new reaction
        message.reactions.push({
          emoji,
          users: [user._id],
        });
      }
      
      await message.save();
      await message.populate('sender');
      
      return message;
    },
    
    removeReaction: async (_, { messageId, emoji }, { user }) => {
      isAuthenticated(user);
      
      const message = await Message.findById(messageId);
      
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Find reaction
      const reactionIndex = message.reactions.findIndex(
        (reaction) => reaction.emoji === emoji
      );
      
      if (reactionIndex !== -1) {
        // Remove user from reaction
        message.reactions[reactionIndex].users = message.reactions[reactionIndex].users.filter(
          (userId) => userId.toString() !== user._id.toString()
        );
        
        // Remove reaction if no users left
        if (message.reactions[reactionIndex].users.length === 0) {
          message.reactions.splice(reactionIndex, 1);
        }
        
        await message.save();
      }
      
      await message.populate('sender');
      
      return message;
    },
    
    markAsRead: async (_, { messageId }, { user }) => {
      isAuthenticated(user);
      
      const message = await Message.findById(messageId);
      
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Check if user already read the message
      if (!message.readBy.includes(user._id)) {
        message.readBy.push(user._id);
        await message.save();
      }
      
      return true;
    },
  },
  
  Message: {
    sender: async (parent) => {
      return User.findById(parent.sender);
    },
    
    readBy: async (parent) => {
      return User.find({ _id: { $in: parent.readBy } });
    },
  },
};