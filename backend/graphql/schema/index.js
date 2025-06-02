// graphql/schema.js
const { gql } = require('apollo-server-express');

const typeDefs = gql`
  # User Types
  type User {
    _id: ID!
    username: String!
    email: String!
    profilePicture: String
    status: String
    createdAt: String
    updatedAt: String
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # Workspace Types
  type WorkspaceMember {
    userId: ID!
    role: String!
  }

  type Workspace {
    _id: ID!
    name: String!
    description: String
    owner: User!
    members: [WorkspaceMember!]!
    isPublic: Boolean
    category: String
    memberCount: Int
    createdAt: String
    updatedAt: String
  }

  input WorkspaceInput {
    name: String!
    description: String
  }

  # Invitation Types
  type WorkspaceInvitation {
    _id: ID!
    workspaceId: ID!
    workspace: Workspace
    email: String!
    invitedBy: User!
    status: String!
    role: String!
    token: String!
    expiresAt: String!
    createdAt: String
  }

  input WorkspaceInvitationInput {
    workspaceId: ID!
    email: String!
    role: String
  }

  # Access Request Types
  type WorkspaceAccessRequest {
    _id: ID!
    user: User!
    workspaceId: ID!
    workspace: Workspace
    status: String!
    message: String
    createdAt: String!
    updatedAt: String
  }

  # Filter Types
  input WorkspaceFilterInput {
    category: String
    isPublic: Boolean
    search: String
  }

  # Channel Types
  type Channel {
    _id: ID!
    name: String!
    description: String
    workspaceId: ID!
    type: String!
    members: [User!]
    createdAt: String
    updatedAt: String
  }

  input ChannelInput {
    name: String!
    description: String
    workspaceId: ID!
    type: String
    members: [ID]
  }

  # Message Types
  type MessageAttachment {
    type: String!
    url: String!
    name: String!
  }

  type MessageReaction {
    emoji: String!
    users: [User!]!
  }

  type Message {
    _id: ID!
    channelId: ID!
    sender: User!
    content: String!
    attachments: [MessageAttachment!]
    reactions: [MessageReaction!]
    threadId: ID
    readBy: [User!]
    createdAt: String
    updatedAt: String
  }

  input MessageInput {
    channelId: ID!
    content: String!
    attachments: [MessageAttachmentInput]
    threadId: ID
  }

  input MessageAttachmentInput {
    type: String!
    url: String!
    name: String!
  }

  # Task Types
  type Task {
    _id: ID!
    title: String!
    description: String
    workspaceId: ID!
    status: String!
    priority: String!
    assignees: [User!]
    dueDate: String
    attachments: [TaskAttachment!]
    comments: [TaskComment!]
    createdBy: User!
    createdAt: String
    updatedAt: String
  }

  type TaskAttachment {
    type: String!
    url: String!
    name: String!
  }

  type TaskComment {
    user: User!
    content: String!
    createdAt: String!
  }

  input TaskInput {
    title: String!
    description: String
    workspaceId: ID!
    status: String
    priority: String
    assignees: [ID!]
    dueDate: String
    attachments: [TaskAttachmentInput]
  }

  input TaskAttachmentInput {
    type: String!
    url: String!
    name: String!
  }

  input TaskCommentInput {
    taskId: ID!
    content: String!
  }

  # Meeting Types
  type Meeting {
    _id: ID!
    title: String!
    description: String
    workspaceId: ID!
    host: User!
    participants: [User!]
    startTime: String
    endTime: String
    status: String!
    recordingUrl: String
    createdAt: String
    updatedAt: String
  }

  input MeetingInput {
    title: String!
    description: String
    workspaceId: ID!
    participants: [ID!]
    startTime: String
    endTime: String
  }

  # Activity Types
  type Activity {
    _id: ID!
    type: String!
    title: String!
    content: String!
    workspace: Workspace!
    user: User!
    createdAt: String!
  }

  # Notification Types
  type Notification {
    _id: ID!
    type: String!
    title: String!
    content: String
    user: ID!
    relatedId: ID
    read: Boolean!
    createdAt: String!
  }

  # Query and Mutation
  type Query {
    # User Queries
    me: User
    getUser(id: ID!): User
    searchUsers(query: String!): [User!]

    # Workspace Queries
    getUserWorkspaces: [Workspace!]
    getWorkspace(id: ID!): Workspace
    getWorkspaceMembers(workspaceId: ID!): [User!]
    searchPublicWorkspaces(query: String!, filter: WorkspaceFilterInput): [Workspace!]

    # Channel Queries
    getWorkspaceChannels(workspaceId: ID!): [Channel!]
    getChannel(id: ID!): Channel

    # Message Queries
    getChannelMessages(channelId: ID!, limit: Int, offset: Int): [Message!]
    getMessage(id: ID!): Message
    getThreadMessages(threadId: ID!): [Message!]

    # Task Queries
    getWorkspaceTasks(workspaceId: ID!): [Task!]
    getTask(id: ID!): Task
    getTasksByAssignee(assigneeId: ID!): [Task!]

    # Meeting Queries
    getWorkspaceMeetings(workspaceId: ID!): [Meeting!]
    getMeetingDetails(meetingId: ID!): Meeting
    getUpcomingMeetings: [Meeting!]

    # Activity Queries
    getRecentActivities: [Activity!]

    # Notification Queries
    getUserNotifications: [Notification!]
    getUnreadNotificationsCount: Int!

    # Invitation queries
    getWorkspaceInvitations(workspaceId: ID!): [WorkspaceInvitation!]
    getPendingInvitations: [WorkspaceInvitation!]
    
    # Access request queries
    getWorkspaceAccessRequests(workspaceId: ID!): [WorkspaceAccessRequest!]
    getPendingWorkspaceRequests: [WorkspaceAccessRequest!]
  }

  type Mutation {
    # User Mutations
    registerUser(input: RegisterInput!): User!
    login(email: String!, password: String!): AuthPayload!
    updateUserProfile(profilePicture: String, status: String): User!
    updateUserPassword(currentPassword: String!, newPassword: String!): Boolean!

    # Workspace Mutations
    createWorkspace(input: WorkspaceInput!): Workspace!
    updateWorkspace(id: ID!, input: WorkspaceInput!): Workspace!
    deleteWorkspace(id: ID!): Boolean!
    addWorkspaceMember(workspaceId: ID!, userId: ID!, role: String): Workspace!
    removeWorkspaceMember(workspaceId: ID!, userId: ID!): Workspace!
    updateMemberRole(workspaceId: ID!, userId: ID!, role: String!): Workspace!
    updateWorkspaceSettings(workspaceId: ID!, isPublic: Boolean!, category: String): Workspace!

    # Channel Mutations
    createChannel(input: ChannelInput!): Channel!
    updateChannel(id: ID!, input: ChannelInput!): Channel!
    deleteChannel(id: ID!): Boolean!
    addChannelMember(channelId: ID!, userId: ID!): Channel!
    removeChannelMember(channelId: ID!, userId: ID!): Channel!

    # Message Mutations
    sendMessage(input: MessageInput!): Message!
    updateMessage(id: ID!, content: String!): Message!
    deleteMessage(id: ID!): Boolean!
    addReaction(messageId: ID!, emoji: String!): Message!
    removeReaction(messageId: ID!, emoji: String!): Message!
    markAsRead(messageId: ID!): Boolean!

    # Task Mutations
    createTask(input: TaskInput!): Task!
    updateTask(id: ID!, input: TaskInput!): Task!
    deleteTask(id: ID!): Boolean!
    addTaskComment(input: TaskCommentInput!): Task!

    # Meeting Mutations
    createMeeting(input: MeetingInput!): Meeting!
    updateMeeting(id: ID!, input: MeetingInput!): Meeting!
    deleteMeeting(id: ID!): Boolean!
    joinMeeting(meetingId: ID!): Meeting!
    leaveMeeting(meetingId: ID!): Boolean!
    endMeeting(meetingId: ID!): Meeting!
    sendMeetingInvite(meetingId: ID!, userIds: [ID!]!): Boolean!

    # Notification Mutations
    markNotificationAsRead(notificationId: ID!): Boolean!
    markAllNotificationsAsRead: Boolean!
    deleteNotification(notificationId: ID!): Boolean!

    # Invitation mutations
    inviteUserToWorkspace(input: WorkspaceInvitationInput!): WorkspaceInvitation!
    acceptWorkspaceInvitation(token: String!): Workspace!
    rejectWorkspaceInvitation(token: String!): Boolean!
    cancelWorkspaceInvitation(invitationId: ID!): Boolean!
    
    # Access request mutations
    requestWorkspaceAccess(workspaceId: ID!, message: String): WorkspaceAccessRequest!
    approveWorkspaceAccessRequest(requestId: ID!): WorkspaceAccessRequest!
    rejectWorkspaceAccessRequest(requestId: ID!): WorkspaceAccessRequest!
  }
`;

module.exports = typeDefs;