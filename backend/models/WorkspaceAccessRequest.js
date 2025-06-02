// models/WorkspaceAccessRequest.js
const mongoose = require('mongoose');

const WorkspaceAccessRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    message: {
      type: String,
      default: '',
    }
  },
  { timestamps: true }
);

// Create a compound index to ensure a user can only have one active request per workspace
WorkspaceAccessRequestSchema.index({ user: 1, workspaceId: 1 }, { unique: true });

const WorkspaceAccessRequest = mongoose.model('WorkspaceAccessRequest', WorkspaceAccessRequestSchema);

module.exports = WorkspaceAccessRequest;