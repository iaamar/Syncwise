const User = require('../../models/User');
const Workspace = require('../../models/Workspace');
const Message = require('../../models/Message');
const Task = require('../../models/Task');
const { isAuthenticated } = require('../../middleware/auth');

// In a production app, you would have a dedicated Activity model
// This is a simplified version that generates activities from other models

module.exports = {
  Query: {
    getRecentActivities: async (_, __, { user }) => {
      isAuthenticated(user);
      
      // Get workspaces where user is a member
      const workspaces = await Workspace.find({
        $or: [
          { owner: user._id },
          { 'members.userId': user._id },
        ],
      });
      
      const workspaceIds = workspaces.map(w => w._id);
      
      // Get recent messages as activities
      const messageActivities = await Message.aggregate([
        {
          $match: {
            channelId: { $exists: true },
            threadId: null, // Only main messages, not thread replies
            createdAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: 'channels',
            localField: 'channelId',
            foreignField: '_id',
            as: 'channel',
          },
        },
        {
          $unwind: '$channel',
        },
        {
          $match: {
            'channel.workspaceId': { $in: workspaceIds },
          },
        },
        {
          $lookup: {
            from: 'workspaces',
            localField: 'channel.workspaceId',
            foreignField: '_id',
            as: 'workspace',
          },
        },
        {
          $unwind: '$workspace',
        },
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $project: {
            _id: '$_id',
            type: { $literal: 'chat' },
            title: { $concat: ['New message in #', '$channel.name'] },
            content: '$content',
            workspace: {
              _id: '$workspace._id',
              name: '$workspace.name',
            },
            user: {
              _id: '$user._id',
              username: '$user.username',
              profilePicture: '$user.profilePicture',
            },
            createdAt: '$createdAt',
          },
        },
      ]);
      
      // Get recent tasks as activities
      const taskActivities = await Task.aggregate([
        {
          $match: {
            workspaceId: { $in: workspaceIds },
            updatedAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
          },
        },
        {
          $sort: { updatedAt: -1 },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: 'workspaces',
            localField: 'workspaceId',
            foreignField: '_id',
            as: 'workspace',
          },
        },
        {
          $unwind: '$workspace',
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $project: {
            _id: '$_id',
            type: { $literal: 'task' },
            title: { $concat: ['Task ', '$title', ' ', { $cond: [{ $eq: ['$status', 'done'] }, 'completed', 'updated'] }] },
            content: '$description',
            workspace: {
              _id: '$workspace._id',
              name: '$workspace.name',
            },
            user: {
              _id: '$user._id',
              username: '$user.username',
              profilePicture: '$user.profilePicture',
            },
            createdAt: '$updatedAt',
          },
        },
      ]);
      
      // Combine and sort activities
      const activities = [...messageActivities, ...taskActivities].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      return activities.slice(0, 20); // Return top 20 activities
    },
  },
};