const Workspace = require('../../models/Workspace');
const Channel = require('../../models/Channel');
const User = require('../../models/User');
const { isAuthenticated } = require('../../middleware/auth');

module.exports = {
  Query: {
    getUserWorkspaces: async (_, __, { user }) => {
      isAuthenticated(user);
      
      return Workspace.find({
        $or: [
          { owner: user._id },
          { 'members.userId': user._id },
        ],
      }).populate('owner');
    },
    
    getWorkspace: async (_, { id }, { user }) => {
      isAuthenticated(user);
      
      const workspace = await Workspace.findById(id).populate('owner');
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      // Check if user is a member or owner
      const isMember = workspace.members.some(
        (member) => member.userId.toString() === user._id.toString()
      );
      
      const isOwner = workspace.owner._id.toString() === user._id.toString();
      
      if (!isMember && !isOwner) {
        throw new Error('Not authorized to access this workspace');
      }
      
      return workspace;
    },
    
    getWorkspaceMembers: async (_, { workspaceId }, { user }) => {
      isAuthenticated(user);
      
      const workspace = await Workspace.findById(workspaceId);
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      // Get owner
      const owner = await User.findById(workspace.owner);
      
      // Get members
      const memberIds = workspace.members.map((member) => member.userId);
      const members = await User.find({ _id: { $in: memberIds } });
      
      // Combine owner and members, ensuring no duplicates
      const allMembers = [owner];
      
      members.forEach((member) => {
        if (member._id.toString() !== owner._id.toString()) {
          allMembers.push(member);
        }
      });
      
      return allMembers;
    },
    searchPublicWorkspaces: async (_, { query, filter = {} }, { user }) => {
      isAuthenticated(user);
      
      // Build search query
      const searchQuery = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      };
      
      // Apply filters
      if (filter.category) {
        searchQuery.category = filter.category;
      }
      
      if (filter.isPublic !== undefined) {
        searchQuery.isPublic = filter.isPublic;
      } else {
        // Default to public workspaces only
        searchQuery.isPublic = true;
      }
      
      // Exclude workspaces where user is already a member
      const excludeQuery = {
        $and: [
          { _id: { $nin: [] } } // Will be populated below
        ]
      };
      
      // Get workspaces where user is already a member
      const userWorkspaces = await Workspace.find({
        $or: [
          { owner: user._id },
          { 'members.userId': user._id }
        ]
      });
      
      // Exclude these workspaces from search results
      excludeQuery.$and[0]._id.$nin = userWorkspaces.map(w => w._id);
      
      // Combine queries
      const finalQuery = {
        $and: [
          searchQuery,
          excludeQuery
        ]
      };
      
      return await Workspace.find(finalQuery)
        .populate('owner')
        .sort({ createdAt: -1 })
        .limit(50); // Limit results to prevent overwhelming response
    },
  },
  
  Mutation: {
    createWorkspace: async (_, { input }, { user }) => {
      isAuthenticated(user);
      
      const { name, description } = input;
      
      // Create workspace
      const workspace = new Workspace({
        name,
        description,
        owner: user._id,
        members: [{ userId: user._id, role: 'admin' }],
      });
      
      await workspace.save();
      
      // Create default channels
      await Channel.create({
        name: 'general',
        description: 'General discussion',
        workspaceId: workspace._id,
        type: 'public',
        members: [user._id],
      });
      
      await Channel.create({
        name: 'random',
        description: 'Random topics',
        workspaceId: workspace._id,
        type: 'public',
        members: [user._id],
      });
      
      return workspace;
    },
    
    updateWorkspace: async (_, { id, input }, { user }) => {
      isAuthenticated(user);
      
      const workspace = await Workspace.findById(id);
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      // Check if user is owner or admin
      const isOwner = workspace.owner.toString() === user._id.toString();
      const isAdmin = workspace.members.some(
        (member) => 
          member.userId.toString() === user._id.toString() && 
          member.role === 'admin'
      );
      
      if (!isOwner && !isAdmin) {
        throw new Error('Not authorized to update this workspace');
      }
      
      // Update workspace
      workspace.name = input.name || workspace.name;
      workspace.description = input.description !== undefined 
        ? input.description 
        : workspace.description;
      
      await workspace.save();
      
      return workspace;
    },

    updateWorkspaceSettings: async (_, { workspaceId, isPublic, category }, { user }) => {
      isAuthenticated(user);
      
      // Find workspace
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      // Check if user is owner
      if (workspace.owner.toString() !== user._id.toString()) {
        throw new Error('Only the workspace owner can update these settings');
      }
      
      // Update settings
      workspace.isPublic = isPublic;
      if (category) {
        workspace.category = category;
      }
      
      await workspace.save();
      return workspace;
    },
    
    deleteWorkspace: async (_, { id }, { user }) => {
      isAuthenticated(user);
      
      const workspace = await Workspace.findById(id);
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      // Check if user is owner
      if (workspace.owner.toString() !== user._id.toString()) {
        throw new Error('Only the workspace owner can delete it');
      }
      
      // Delete associated channels
      await Channel.deleteMany({ workspaceId: id });
      
      // Delete workspace
      await Workspace.findByIdAndDelete(id);
      
      return true;
    },
    
    addWorkspaceMember: async (_, { workspaceId, userId, role = 'member' }, { user }) => {
      isAuthenticated(user);
      
      const workspace = await Workspace.findById(workspaceId);
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      // Check if user is owner or admin
      const isOwner = workspace.owner.toString() === user._id.toString();
      const isAdmin = workspace.members.some(
        (member) => 
          member.userId.toString() === user._id.toString() && 
          member.role === 'admin'
      );
      
      if (!isOwner && !isAdmin) {
        throw new Error('Not authorized to add members to this workspace');
      }
      
      // Check if user exists
      const userToAdd = await User.findById(userId);
      
      if (!userToAdd) {
        throw new Error('User not found');
      }
      
      // Check if user is already a member
      const isMember = workspace.members.some(
        (member) => member.userId.toString() === userId
      );
      
      if (isMember) {
        throw new Error('User is already a member of this workspace');
      }
      
      // Add user to workspace
      workspace.members.push({ userId, role });
      await workspace.save();
      
      // Add user to all public channels
      const publicChannels = await Channel.find({
        workspaceId,
        type: 'public',
      });
      
      for (const channel of publicChannels) {
        channel.members.push(userId);
        await channel.save();
      }
      
      return workspace;
    },
    
    removeWorkspaceMember: async (_, { workspaceId, userId }, { user }) => {
      isAuthenticated(user);
      
      const workspace = await Workspace.findById(workspaceId);
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      // Check if user is owner or admin
      const isOwner = workspace.owner.toString() === user._id.toString();
      const isAdmin = workspace.members.some(
        (member) => 
          member.userId.toString() === user._id.toString() && 
          member.role === 'admin'
      );
      
      if (!isOwner && !isAdmin) {
        throw new Error('Not authorized to remove members from this workspace');
      }
      
      // Cannot remove the owner
      if (workspace.owner.toString() === userId) {
        throw new Error('Cannot remove the workspace owner');
      }
      
      // Check if user is a member
      const memberIndex = workspace.members.findIndex(
        (member) => member.userId.toString() === userId
      );
      
      if (memberIndex === -1) {
        throw new Error('User is not a member of this workspace');
      }
      
      // Remove user from workspace
      workspace.members.splice(memberIndex, 1);
      await workspace.save();
      
      // Remove user from all channels
      const channels = await Channel.find({ workspaceId });
      
      for (const channel of channels) {
        channel.members = channel.members.filter(
          (memberId) => memberId.toString() !== userId
        );
        await channel.save();
      }
      
      return workspace;
    },
    
    updateMemberRole: async (_, { workspaceId, userId, role }, { user }) => {
      isAuthenticated(user);
      
      const workspace = await Workspace.findById(workspaceId);
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      // Check if user is owner or admin
      const isOwner = workspace.owner.toString() === user._id.toString();
      
      if (!isOwner) {
        throw new Error('Only the workspace owner can update member roles');
      }
      
      // Cannot update the owner's role
      if (workspace.owner.toString() === userId) {
        throw new Error('Cannot update the workspace owner\'s role');
      }
      
      // Check if user is a member
      const memberIndex = workspace.members.findIndex(
        (member) => member.userId.toString() === userId
      );
      
      if (memberIndex === -1) {
        throw new Error('User is not a member of this workspace');
      }
      
      // Update member role
      workspace.members[memberIndex].role = role;
      await workspace.save();
      
      return workspace;
    },
  },
  
  // Field resolvers
  Workspace: {
    owner: async (parent) => {
      return User.findById(parent.owner);
    },
    memberCount: async (parent) => {
      return parent.members.length + 1; // +1 for the owner
    },
  },
};