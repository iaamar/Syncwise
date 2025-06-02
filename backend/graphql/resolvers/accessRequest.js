// graphql/resolvers/accessRequest.js
const WorkspaceAccessRequest = require('../../models/WorkspaceAccessRequest');
const Workspace = require('../../models/Workspace');
const User = require('../../models/User');
const { isAuthenticated } = require('../../middleware/auth');
const { UserInputError } = require('apollo-server-express');

module.exports = {
  Query: {
    getWorkspaceAccessRequests: async (_, { workspaceId }, { user }) => {
      isAuthenticated(user);
      
      // Check if user is workspace owner or admin
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      const isOwner = workspace.owner.toString() === user._id.toString();
      const isAdmin = workspace.members.some(
        member => member.userId.toString() === user._id.toString() && member.role === 'admin'
      );
      
      if (!isOwner && !isAdmin) {
        throw new Error('Not authorized to view access requests');
      }
      
      return await WorkspaceAccessRequest.find({ workspaceId })
        .populate('user')
        .sort({ createdAt: -1 });
    },
    
    getPendingWorkspaceRequests: async (_, __, { user }) => {
      isAuthenticated(user);
      
      // Get all workspaces where user is owner or admin
      const ownedWorkspaces = await Workspace.find({ owner: user._id });
      
      const adminWorkspaces = await Workspace.find({
        'members.userId': user._id,
        'members.role': 'admin'
      });
      
      const workspaceIds = [
        ...ownedWorkspaces.map(w => w._id),
        ...adminWorkspaces.map(w => w._id)
      ];
      
      // Get pending requests for these workspaces
      return await WorkspaceAccessRequest.find({
        workspaceId: { $in: workspaceIds },
        status: 'pending'
      })
        .populate('user')
        .populate('workspaceId')
        .sort({ createdAt: -1 });
    },
  },
  
  Mutation: {
    requestWorkspaceAccess: async (_, { workspaceId, message = '' }, { user }) => {
      isAuthenticated(user);
      
      // Check if workspace exists and is public
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      // Check if user is already a member
      const isMember = workspace.members.some(
        member => member.userId.toString() === user._id.toString()
      );
      
      const isOwner = workspace.owner.toString() === user._id.toString();
      
      if (isMember || isOwner) {
        throw new UserInputError('You are already a member of this workspace');
      }
      
      // Check if there's already a pending request
      const existingRequest = await WorkspaceAccessRequest.findOne({
        workspaceId,
        user: user._id,
        status: 'pending'
      });
      
      if (existingRequest) {
        throw new UserInputError('You already have a pending request for this workspace');
      }
      
      // Create request
      const request = new WorkspaceAccessRequest({
        workspaceId,
        user: user._id,
        status: 'pending',
        message
      });
      
      await request.save();
      await request.populate('user');
      
      // Emit socket event for real-time notification
      const io = req.app.get('io');
      if (io) {
        io.emit('request-created', { request, workspaceId });
      }
      
      return request;
    },
    
    approveWorkspaceAccessRequest: async (_, { requestId }, { user }) => {
      isAuthenticated(user);
      
      // Find request
      const request = await WorkspaceAccessRequest.findById(requestId);
      if (!request) {
        throw new Error('Request not found');
      }
      
      // Check if request is pending
      if (request.status !== 'pending') {
        throw new UserInputError('This request has already been processed');
      }
      
      // Check if user is authorized to approve
      const workspace = await Workspace.findById(request.workspaceId);
      
      const isOwner = workspace.owner.toString() === user._id.toString();
      const isAdmin = workspace.members.some(
        member => member.userId.toString() === user._id.toString() && member.role === 'admin'
      );
      
      if (!isOwner && !isAdmin) {
        throw new Error('Not authorized to approve this request');
      }
      
      // Add user to workspace
      workspace.members.push({
        userId: request.user,
        role: 'member',
      });
      
      await workspace.save();
      
      // Update request status
      request.status = 'approved';
      await request.save();
      await request.populate('user');
      
      return request;
    },
    
    rejectWorkspaceAccessRequest: async (_, { requestId }, { user }) => {
      isAuthenticated(user);
      
      // Find request
      const request = await WorkspaceAccessRequest.findById(requestId);
      if (!request) {
        throw new Error('Request not found');
      }
      
      // Check if request is pending
      if (request.status !== 'pending') {
        throw new UserInputError('This request has already been processed');
      }
      
      // Check if user is authorized to reject
      const workspace = await Workspace.findById(request.workspaceId);
      
      const isOwner = workspace.owner.toString() === user._id.toString();
      const isAdmin = workspace.members.some(
        member => member.userId.toString() === user._id.toString() && member.role === 'admin'
      );
      
      if (!isOwner && !isAdmin) {
        throw new Error('Not authorized to reject this request');
      }
      
      // Update request status
      request.status = 'rejected';
      await request.save();
      await request.populate('user');
      
      return request;
    },
  },
  
  WorkspaceAccessRequest: {
    user: async (parent) => {
      if (parent.user._id) return parent.user;
      return await User.findById(parent.user);
    },
    
    workspaceId: async (parent) => {
      if (parent.workspaceId._id) return parent.workspaceId;
      return await Workspace.findById(parent.workspaceId);
    },
  },
};