const Meeting = require('../../models/Meeting');
const User = require('../../models/User');
const { isAuthenticated } = require('../../middleware/auth');

module.exports = {
  Query: {
    getWorkspaceMeetings: async (_, { workspaceId }, { user }) => {
      isAuthenticated(user);
      
      const meetings = await Meeting.find({ workspaceId })
        .populate('host')
        .populate('participants')
        .sort({ startTime: 1 });
      
      return meetings;
    },
    
    getMeetingDetails: async (_, { meetingId }, { user }) => {
      isAuthenticated(user);
      
      const meeting = await Meeting.findById(meetingId)
        .populate('host')
        .populate('participants');
      
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      return meeting;
    },
    
    getUpcomingMeetings: async (_, __, { user }) => {
      isAuthenticated(user);
      
      const now = new Date();
      
      const meetings = await Meeting.find({
        participants: user._id,
        startTime: { $gt: now },
        status: { $ne: 'cancelled' },
      })
        .populate('host')
        .populate('participants')
        .sort({ startTime: 1 })
        .limit(5);
      
      return meetings;
    },
  },
  
  Mutation: {
    createMeeting: async (_, { input }, { user }) => {
      isAuthenticated(user);
      
      const { title, description, workspaceId, participants, startTime, endTime } = input;
      
      // Create meeting
      const meeting = new Meeting({
        title,
        description,
        workspaceId,
        host: user._id,
        participants: [...new Set([...participants, user._id])], // Ensure unique participants and include host
        startTime,
        endTime,
        status: 'scheduled',
      });
      
      await meeting.save();
      await meeting.populate('host');
      await meeting.populate('participants');
      
      return meeting;
    },
    
    updateMeeting: async (_, { id, input }, { user }) => {
      isAuthenticated(user);
      
      const meeting = await Meeting.findById(id);
      
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      // Check if user is the host
      if (meeting.host.toString() !== user._id.toString()) {
        throw new Error('Only the host can update the meeting');
      }
      
      // Update meeting properties
      if (input.title) meeting.title = input.title;
      if (input.description !== undefined) meeting.description = input.description;
      if (input.participants) meeting.participants = [...new Set([...input.participants, user._id])];
      if (input.startTime) meeting.startTime = input.startTime;
      if (input.endTime) meeting.endTime = input.endTime;
      
      await meeting.save();
      await meeting.populate('host');
      await meeting.populate('participants');
      
      return meeting;
    },
    
    deleteMeeting: async (_, { id }, { user }) => {
      isAuthenticated(user);
      
      const meeting = await Meeting.findById(id);
      
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      // Check if user is the host
      if (meeting.host.toString() !== user._id.toString()) {
        throw new Error('Only the host can delete the meeting');
      }
      
      await Meeting.findByIdAndDelete(id);
      
      return true;
    },
    
    joinMeeting: async (_, { meetingId }, { user }) => {
      isAuthenticated(user);
      
      const meeting = await Meeting.findById(meetingId);
      
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      if (meeting.status === 'cancelled') {
        throw new Error('Meeting has been cancelled');
      }
      
      // If meeting hasn't started yet, mark it as in-progress
      if (meeting.status === 'scheduled') {
        meeting.status = 'in-progress';
      }
      
      // Add user to participants if not already there
      if (!meeting.participants.includes(user._id)) {
        meeting.participants.push(user._id);
      }
      
      await meeting.save();
      await meeting.populate('host');
      await meeting.populate('participants');
      
      return meeting;
    },
    
    leaveMeeting: async (_, { meetingId }, { user }) => {
      isAuthenticated(user);
      
      const meeting = await Meeting.findById(meetingId);
      
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      // If user is the host and only participant, end the meeting
      if (
        meeting.host.toString() === user._id.toString() &&
        meeting.participants.length === 1
      ) {
        meeting.status = 'completed';
        meeting.endTime = new Date();
      }
      
      await meeting.save();
      
      return true;
    },
    
    endMeeting: async (_, { meetingId }, { user }) => {
      isAuthenticated(user);
      
      const meeting = await Meeting.findById(meetingId);
      
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      // Check if user is the host
      if (meeting.host.toString() !== user._id.toString()) {
        throw new Error('Only the host can end the meeting');
      }
      
      meeting.status = 'completed';
      meeting.endTime = new Date();
      
      await meeting.save();
      await meeting.populate('host');
      await meeting.populate('participants');
      
      return meeting;
    },

    sendMeetingInvite: async (_, { meetingId, userIds }, { user, req }) => {
      isAuthenticated(user);
      
      const meeting = await Meeting.findById(meetingId);
      
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      // Check if user is the host or a participant
      const isHost = meeting.host.toString() === user._id.toString();
      const isParticipant = meeting.participants.includes(user._id);
      
      if (!isHost && !isParticipant) {
        throw new Error('Not authorized to send invites for this meeting');
      }
      
      // Get meeting details for notification
      await meeting.populate('host');
      
      // Get socket.io instance
      const io = req?.app?.get('io');
      
      // Helper function to get user sockets
      const getUserSockets = (userId) => {
        if (!io) return [];
        const userSocketMap = io.userSocketMap || new Map();
        const socketIds = userSocketMap.get(userId) || [];
        return socketIds.map(id => io.sockets.sockets.get(id)).filter(Boolean);
      };
      
      // Send invitation to each user
      for (const userId of userIds) {
        // Add user to meeting participants if not already there
        if (!meeting.participants.includes(userId)) {
          meeting.participants.push(userId);
        }
        
        // Send real-time notification via socket.io
        if (io) {
          const userSockets = getUserSockets(userId);
          
          if (userSockets.length > 0) {
            const notificationData = {
              type: 'meeting-invite',
              meetingId,
              title: meeting.title,
              host: {
                _id: meeting.host._id,
                username: meeting.host.username,
                profilePicture: meeting.host.profilePicture
              },
              inviter: {
                _id: user._id,
                username: user.username
              },
              workspaceId: meeting.workspaceId,
              timestamp: new Date().toISOString()
            };
            
            userSockets.forEach(socket => {
              socket.emit('meeting-invite', notificationData);
            });
          }
          
          // Create notification in database (implement if you have a Notification model)
          // This could be added later
        }
      }
      
      // Save updated meeting with new participants
      await meeting.save();
      
      return true;
    }
  },
  
  Meeting: {
    host: async (parent) => {
      if (parent.host._id) return parent.host; // Already populated
      return await User.findById(parent.host);
    },
    
    participants: async (parent) => {
      if (parent.participants?.[0]?._id) return parent.participants; // Already populated
      return await User.find({ _id: { $in: parent.participants } });
    },
  },
};