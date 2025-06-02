// models/Workspace.js
const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member',
        },
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: ['engineering', 'marketing', 'design', 'product', 'support', 'hr', 'education', 'other'],
      default: 'other',
    }
  },
  { timestamps: true }
);

// Add method to get member count
WorkspaceSchema.virtual('memberCount').get(function() {
  return this.members.length + 1; // +1 for the owner
});

// Ensure virtuals are included in JSON and object conversions
WorkspaceSchema.set('toJSON', { virtuals: true });
WorkspaceSchema.set('toObject', { virtuals: true });

const Workspace = mongoose.model('Workspace', WorkspaceSchema);

module.exports = Workspace;