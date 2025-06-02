// graphql/resolvers/invitation.js
const crypto = require('crypto');
const WorkspaceInvitation = require('../../models/WorkspaceInvitation');
const Workspace = require('../../models/Workspace');
const User = require('../../models/User');
const { isAuthenticated } = require('../../middleware/auth');
const { UserInputError } = require('apollo-server-express');

module.exports = {
  Query: {
    getWorkspaceInvitations: async (_, { workspaceId }, { user }) => {
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
        throw new Error('Not authorized to view invitations');
      }
      
      return await WorkspaceInvitation.find({ workspaceId })
        .populate('invitedBy');
    },
    
    getPendingInvitations: async (_, __, { user }) => {
      isAuthenticated(user);
      
      // Find user
      const userData = await User.findById(user._id);
      if (!userData) {
        throw new Error('User not found');
      }
      
      // Find invitations by email
      return await WorkspaceInvitation.find({ 
        email: userData.email,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      })
        .populate('invitedBy')
        .populate({
          path: 'workspaceId',
          populate: { path: 'owner' }
        });
    },
  },
  
  Mutation: {
    inviteUserToWorkspace: async (_, { input }, { user }) => {
      isAuthenticated(user);
      
      const { workspaceId, email, role = 'member' } = input;
      
      // Check if user is authorized to invite
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      const isOwner = workspace.owner.toString() === user._id.toString();
      const isAdmin = workspace.members.some(
        member => member.userId.toString() === user._id.toString() && member.role === 'admin'
      );
      
      if (!isOwner && !isAdmin) {
        throw new Error('Not authorized to invite users');
      }
      
      // Check if user is already a member
      const invitedUser = await User.findOne({ email });
      if (invitedUser) {
        const isMember = workspace.members.some(
          member => member.userId.toString() === invitedUser._id.toString()
        );
        
        if (isMember || workspace.owner.toString() === invitedUser._id.toString()) {
          throw new UserInputError('User is already a member of this workspace');
        }
      }
      
      // Check if there's already a pending invitation
      const existingInvitation = await WorkspaceInvitation.findOne({
        workspaceId,
        email,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      });
      
      if (existingInvitation) {
        throw new UserInputError('An invitation is already pending for this email');
      }
      
      // Generate invitation token
      const token = crypto.randomBytes(20).toString('hex');
      
      // Set expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Create invitation
      const invitation = new WorkspaceInvitation({
        workspaceId,
        email,
        invitedBy: user._id,
        token,
        status: 'pending',
        role,
        expiresAt,
      });
      
      await invitation.save();
      await invitation.populate('invitedBy');
      
      // Emit socket event for real-time notification
      const io = req.app.get('io');
      if (io) {
        io.emit('invitation-created', { invitation });
      }
      
      return invitation;
    },
    
    acceptWorkspaceInvitation: async (_, { token }, { user }) => {
      isAuthenticated(user);
      
      // Find invitation by token
      const invitation = await WorkspaceInvitation.findOne({
        token,
        status: 'pending',
        expiresAt: { $gt: new Date() },
      });
      
      if (!invitation) {
        throw new Error('Invalid or expired invitation');
      }
      
      // Find user
      const userData = await User.findById(user._id);
      
      // Check if the invitation matches the user's email
      if (invitation.email.toLowerCase() !== userData.email.toLowerCase()) {
        throw new Error('This invitation was sent to a different email address');
      }
      
      // Get workspace
      const workspace = await Workspace.findById(invitation.workspaceId);
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      // Add user to workspace
      workspace.members.push({
        userId: user._id,
        role: invitation.role,
      });
      
      await workspace.save();
      
      // Update invitation status
      invitation.status = 'accepted';
      await invitation.save();
      
      // Return updated workspace
      return workspace;
    },
    
    rejectWorkspaceInvitation: async (_, { token }, { user }) => {
      isAuthenticated(user);
      
      // Find invitation by token
      const invitation = await WorkspaceInvitation.findOne({
        token,
        status: 'pending',
      });
      
      if (!invitation) {
        throw new Error('Invalid invitation');
      }
      
      // Find user
      const userData = await User.findById(user._id);
      
      // Check if the invitation matches the user's email
      if (invitation.email.toLowerCase() !== userData.email.toLowerCase()) {
        throw new Error('This invitation was sent to a different email address');
      }
      
      // Update invitation status
      invitation.status = 'rejected';
      await invitation.save();
      
      return true;
    },
    
    cancelWorkspaceInvitation: async (_, { invitationId }, { user }) => {
      isAuthenticated(user);
      
      // Find invitation
      const invitation = await WorkspaceInvitation.findById(invitationId);
      
      if (!invitation) {
        throw new Error('Invitation not found');
      }
      
      // Check if user is authorized to cancel
      const workspace = await Workspace.findById(invitation.workspaceId);
      
      const isOwner = workspace.owner.toString() === user._id.toString();
      const isAdmin = workspace.members.some(
        member => member.userId.toString() === user._id.toString() && member.role === 'admin'
      );
      const isInviter = invitation.invitedBy.toString() === user._id.toString();
      
      if (!isOwner && !isAdmin && !isInviter) {
        throw new Error('Not authorized to cancel this invitation');
      }
      
      // Delete invitation
      await WorkspaceInvitation.findByIdAndDelete(invitationId);
      
      return true;
    },
  },
  
  WorkspaceInvitation: {
    invitedBy: async (parent) => {
      if (parent.invitedBy._id) return parent.invitedBy;
      return await User.findById(parent.invitedBy);
    },
    workspace: async (parent) => {
      return await Workspace.findById(parent.workspaceId);
    }
  },  
};