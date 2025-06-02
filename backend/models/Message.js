const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    attachments: [
      {
        type: {
          type: String,
          enum: ['image', 'document', 'link'],
        },
        url: String,
        name: String,
      },
    ],
    reactions: [
      {
        emoji: String,
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    ],
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;