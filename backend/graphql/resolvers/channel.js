// backend/graphql/resolvers/channel.js
const Channel = require('../../models/Channel');
const User = require('../../models/User');
const { isAuthenticated } = require('../../middleware/auth');

module.exports = {
  Query: {
    getWorkspaceChannels: async (_, { workspaceId }, { user }) => {
      isAuthenticated(user);
      
      // Get all public channels
      const publicChannels = await Channel.find({
        workspaceId,
        type: 'public',
      });
      
      // Get private channels where user is a member
      const privateChannels = await Channel.find({
        workspaceId,
        type: 'private',
        members: user._id,
      });
      
      return [...publicChannels, ...privateChannels];
    },
    
    getChannel: async (_, { id }, { user }) => {
      isAuthenticated(user);
      
      const channel = await Channel.findById(id);
      
      if (!channel) {
        throw new Error('Channel not found');
      }
      
      // Check if user is a member or channel is public
      if (channel.type === 'private' && !channel.members.includes(user._id)) {
        throw new Error('Not authorized to access this channel');
      }
      
      return channel;
    },
  },
  
  Mutation: {
    createChannel: async (_, { input }, { user }) => {
      isAuthenticated(user);
      
      const { name, description, workspaceId, type = 'public', members = [] } = input;
      
      // Create channel
      const channel = new Channel({
        name,
        description,
        workspaceId,
        type,
        members: [...new Set([...members, user._id])], // Ensure unique members and include creator
      });
      
      await channel.save();
      
      return channel;
    },
    
    updateChannel: async (_, { id, input }, { user }) => {
      isAuthenticated(user);
      
      const channel = await Channel.findById(id);
      
      if (!channel) {
        throw new Error('Channel not found');
      }
      
      // Update channel properties
      channel.name = input.name || channel.name;
      channel.description = input.description !== undefined 
        ? input.description 
        : channel.description;
      
      if (input.type) {
        channel.type = input.type;
      }
      
      await channel.save();
      
      return channel;
    },
    
    deleteChannel: async (_, { id }, { user }) => {
      isAuthenticated(user);
      
      const channel = await Channel.findById(id);
      
      if (!channel) {
        throw new Error('Channel not found');
      }
      
      await Channel.findByIdAndDelete(id);
      
      return true;
    },
    
    addChannelMember: async (_, { channelId, userId }, { user }) => {
      isAuthenticated(user);
      
      const channel = await Channel.findById(channelId);
      
      if (!channel) {
        throw new Error('Channel not found');
      }
      
      // Check if user is already a member
      if (channel.members.includes(userId)) {
        throw new Error('User is already a member of this channel');
      }
      
      // Add user to channel
      channel.members.push(userId);
      await channel.save();
      
      return channel;
    },
    
    removeChannelMember: async (_, { channelId, userId }, { user }) => {
      isAuthenticated(user);
      
      const channel = await Channel.findById(channelId);
      
      if (!channel) {
        throw new Error('Channel not found');
      }
      
      // Check if user is a member
      if (!channel.members.includes(userId)) {
        throw new Error('User is not a member of this channel');
      }
      
      // Remove user from channel
      channel.members = channel.members.filter(
        (memberId) => memberId.toString() !== userId
      );
      await channel.save();
      
      return channel;
    },
  },
  
  Channel: {
    members: async (parent) => {
      return User.find({ _id: { $in: parent.members } });
    },
  },
};