// graphql/resolvers/index.js
const userResolvers = require('./user');
const workspaceResolvers = require('./workspace');
const channelResolvers = require('./channel');
const messageResolvers = require('./message');
const taskResolvers = require('./task');
const meetingResolvers = require('./meeting');
const activityResolvers = require('./activity');
const invitationResolvers = require('./invitation');
const accessRequestResolvers = require('./accessRequest');

module.exports = {
  Query: {
    ...userResolvers.Query,
    ...workspaceResolvers.Query,
    ...channelResolvers.Query,
    ...messageResolvers.Query,
    ...taskResolvers.Query,
    ...meetingResolvers.Query,
    ...activityResolvers.Query,
    ...invitationResolvers.Query,
    ...accessRequestResolvers.Query,
  },
  
  Mutation: {
    ...userResolvers.Mutation,
    ...workspaceResolvers.Mutation,
    ...channelResolvers.Mutation,
    ...messageResolvers.Mutation,
    ...taskResolvers.Mutation,
    ...meetingResolvers.Mutation,
    ...invitationResolvers.Mutation,
    ...accessRequestResolvers.Mutation,
  },
  
  Workspace: {
    ...workspaceResolvers.Workspace,
  },
  
  Channel: {
    ...channelResolvers.Channel,
  },
  
  Message: {
    ...messageResolvers.Message,
  },
  
  Task: {
    ...taskResolvers.Task,
  },
  
  Meeting: {
    ...meetingResolvers.Meeting,
  },
  
  WorkspaceInvitation: {
    ...invitationResolvers.WorkspaceInvitation,
  },
  
  WorkspaceAccessRequest: {
    ...accessRequestResolvers.WorkspaceAccessRequest,
  },
};