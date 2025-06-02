// models/WorkspaceInvitation.js
const mongoose = require('mongoose');

const WorkspaceInvitationSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    expiresAt: {
      type: Date,
      required: true,
    }
  },
  { timestamps: true }
);

const WorkspaceInvitation = mongoose.model('WorkspaceInvitation', WorkspaceInvitationSchema);

module.exports = WorkspaceInvitation;