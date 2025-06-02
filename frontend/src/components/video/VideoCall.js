import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  Call as CallIcon,
  CallEnd as CallEndIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import Peer from 'simple-peer';

// GraphQL Queries and Mutations
const GET_MEETING_DETAILS = gql`
  query GetMeetingDetails($meetingId: ID!) {
    getMeetingDetails(meetingId: $meetingId) {
      _id
      title
      description
      workspaceId
      host {
        _id
        username
        profilePicture
      }
      participants {
        _id
        username
        profilePicture
      }
      startTime
      endTime
      status
    }
  }
`;

const JOIN_MEETING = gql`
  mutation JoinMeeting($meetingId: ID!) {
    joinMeeting(meetingId: $meetingId) {
      _id
      status
    }
  }
`;

const END_MEETING = gql`
  mutation EndMeeting($meetingId: ID!) {
    endMeeting(meetingId: $meetingId) {
      _id
      status
    }
  }
`;

const VideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  
  // State
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [meetingInfoOpen, setMeetingInfoOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Refs
  const userVideo = useRef();
  const peersRef = useRef({});
  const localStreamRef = useRef();
  
  // Get meeting details
  const { data, loading: meetingLoading, error: meetingError } = useQuery(GET_MEETING_DETAILS, {
    variables: {
      meetingId: roomId,
    },
    fetchPolicy: 'network-only',
  });
  
  // Join meeting mutation
  const [joinMeetingMutation] = useMutation(JOIN_MEETING);
  
  // End meeting mutation
  const [endMeetingMutation] = useMutation(END_MEETING);
  
  // Initialize video call
  useEffect(() => {
    if (socket && user && data?.getMeetingDetails) {
      initializeCall();
    }
  }, [socket, user, data]);
  
  // Initialize call
  const initializeCall = async () => {
    try {
      // Join meeting
      await joinMeetingMutation({
        variables: {
          meetingId: roomId,
        },
      });
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      userVideo.current.srcObject = stream;
      setLocalStream(stream);
      localStreamRef.current = stream;
      
      // Socket events
      socket.emit('join-room', {
        roomId,
        userId: user._id,
      });
      
      // Add current participants to state
      setParticipants(data.getMeetingDetails.participants);
      
      // Listen for new users
      socket.on('user-joined', handleUserJoined);
      
      // Listen for user left
      socket.on('user-left', handleUserLeft);
      
      // Listen for receiving signal
      socket.on('receiving-signal', handleReceivingSignal);
      
      // Listen for returning signal
      socket.on('receiving-returned-signal', handleReceivingReturnedSignal);
      
      // Listen for chat message
      socket.on('chat-message', handleChatMessage);
      
      setLoading(false);
      
      // Clean up
      return () => {
        stream.getTracks().forEach(track => track.stop());
        
        socket.off('user-joined');
        socket.off('user-left');
        socket.off('receiving-signal');
        socket.off('receiving-returned-signal');
        socket.off('chat-message');
        
        socket.emit('leave-room', {
          roomId,
          userId: user._id,
        });
        
        // Close peer connections
        Object.values(peersRef.current).forEach(peer => {
          if (peer.peer) {
            peer.peer.destroy();
          }
        });
      };
    } catch (err) {
      console.error('Error initializing call:', err);
      setLoading(false);
    }
  };
  
  // Handle user joined
  const handleUserJoined = ({ userId, signalData }) => {
    const peer = createPeer(userId, user._id, localStreamRef.current);
    
    peersRef.current[userId] = {
      peer,
      userId,
    };
    
    setPeers(prevPeers => ({
      ...prevPeers,
      [userId]: peer,
    }));
    
    // Find user details
    const newParticipant = data.getMeetingDetails.participants.find(p => p._id === userId);
    
    if (newParticipant) {
      setParticipants(prevParticipants => {
        if (!prevParticipants.some(p => p._id === userId)) {
          return [...prevParticipants, newParticipant];
        }
        return prevParticipants;
      });
    }
  };
  
  // Handle user left
  const handleUserLeft = ({ userId }) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].peer.destroy();
      
      const peersCopy = { ...peersRef.current };
      delete peersCopy[userId];
      peersRef.current = peersCopy;
      
      setPeers(prevPeers => {
        const peersCopy = { ...prevPeers };
        delete peersCopy[userId];
        return peersCopy;
      });
      
      setParticipants(prevParticipants => 
        prevParticipants.filter(p => p._id !== userId)
      );
    }
  };
  
  // Handle receiving signal
  const handleReceivingSignal = ({ userId, signal }) => {
    const peer = addPeer(userId, signal, localStreamRef.current);
    
    peersRef.current[userId] = {
      peer,
      userId,
    };
    
    setPeers(prevPeers => ({
      ...prevPeers,
      [userId]: peer,
    }));
  };
  
  // Handle receiving returned signal
  const handleReceivingReturnedSignal = ({ userId, signal }) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].peer.signal(signal);
    }
  };
  
  // Handle chat message
  const handleChatMessage = ({ userId, message, timestamp }) => {
    const sender = participants.find(p => p._id === userId);
    
    if (sender) {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          sender,
          content: message,
          timestamp,
        },
      ]);
    }
  };
  
  // Create peer
  const createPeer = (receiverId, senderId, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });
    
    peer.on('signal', signal => {
      socket.emit('sending-signal', {
        receiverId,
        senderId,
        signal,
      });
    });
    
    return peer;
  };
  
  // Add peer
  const addPeer = (senderId, incomingSignal, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });
    
    peer.on('signal', signal => {
      socket.emit('returning-signal', {
        receiverId: senderId,
        senderId: user._id,
        signal,
      });
    });
    
    peer.signal(incomingSignal);
    
    return peer;
  };
  
  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };
  
  // Toggle screen sharing
  const toggleScreenSharing = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        
        // Replace video track with screen track
        const videoTrack = localStream.getVideoTracks()[0];
        const screenTrack = stream.getVideoTracks()[0];
        
        // Switch tracks in all peers
        Object.values(peersRef.current).forEach(({ peer }) => {
          const sender = peer._senders.find(s => s.track.kind === 'video');
          sender.replaceTrack(screenTrack);
        });
        
        // Update local video
        userVideo.current.srcObject = stream;
        
        // Save screen stream for cleanup
        setScreenStream(stream);
        setIsScreenSharing(true);
        
        // Handle screen share ended
        screenTrack.onended = () => {
          stopScreenSharing();
        };
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    } else {
      stopScreenSharing();
    }
  };
  
  // Stop screen sharing
  const stopScreenSharing = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      
      // Restore video track
      const videoTrack = localStream.getVideoTracks()[0];
      
      // Switch tracks back in all peers
      Object.values(peersRef.current).forEach(({ peer }) => {
        const sender = peer._senders.find(s => s.track.kind === 'video');
        sender.replaceTrack(videoTrack);
      });
      
      // Update local video
      userVideo.current.srcObject = localStream;
      
      setScreenStream(null);
      setIsScreenSharing(false);
    }
  };
  
  // End call
  const endCall = async () => {
    try {
      // Stop all tracks
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      
      // End meeting if host
      if (data?.getMeetingDetails?.host?._id === user?._id) {
        await endMeetingMutation({
          variables: {
            meetingId: roomId,
          },
        });
      }
      
      // Navigate back
      navigate(`/workspace/${data?.getMeetingDetails?.workspaceId}`);
    } catch (err) {
      console.error('Error ending call:', err);
    }
  };
  
  // Send chat message
  const sendChatMessage = () => {
    if (!messageInput.trim()) return;
    
    socket.emit('send-chat-message', {
      roomId,
      userId: user._id,
      message: messageInput,
      timestamp: new Date().toISOString(),
    });
    
    // Add message to local state
    setMessages(prevMessages => [
      ...prevMessages,
      {
        sender: { 
          _id: user._id, 
          username: user.username, 
          profilePicture: user.profilePicture 
        },
        content: messageInput,
        timestamp: new Date().toISOString(),
      },
    ]);
    
    setMessageInput('');
  };
  
  // Settings menu handlers
  const handleSettingsClick = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };
  
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };
  
  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Add peer video ref handling
  const VideoStream = ({ peer, participant }) => {
    const ref = useRef();

    useEffect(() => {
      if (peer) {
        peer.on('stream', (stream) => {
          if (ref.current) {
            ref.current.srcObject = stream;
          }
        });
      }
    }, [peer]);

    return (
      <Paper
        sx={{
          backgroundColor: 'black',
          position: 'relative',
          paddingTop: '56.25%',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <video
          ref={ref}
          autoPlay
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            borderRadius: 1,
            px: 1,
            py: 0.5,
          }}
        >
          <Typography variant="body2">
            {participant?.username || 'Participant'}
          </Typography>
        </Box>
      </Paper>
    );
  };

  if (loading || meetingLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (meetingError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Error loading meeting
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }
  
  const meeting = data?.getMeetingDetails;
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Meeting Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box>
          <Typography variant="h6">{meeting?.title || 'Video Call'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {participants.length} participants
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            sx={{ mr: 1 }}
            onClick={() => setParticipantsOpen(true)}
          >
            Participants
          </Button>
          <Button
            variant="outlined"
            startIcon={<ChatIcon />}
            onClick={() => setChatOpen(true)}
          >
            Chat
          </Button>
        </Box>
      </Box>

      {/* Video Grid */}
      <Box sx={{ flexGrow: 1, backgroundColor: '#1a1a1a', p: 2, overflow: 'auto' }}>
        <Grid container spacing={2}>
          {/* Local Video */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Paper
              sx={{
                backgroundColor: 'black',
                position: 'relative',
                paddingTop: '56.25%', // 16:9 Aspect Ratio
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <video
                ref={userVideo}
                autoPlay
                playsInline
                muted
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" component="span">
                  You {isMuted && '(Muted)'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          {/* Peer Videos */}
          {Object.entries(peers).map(([userId, peer]) => {
            const participant = participants.find(p => p._id === userId);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={userId}>
                <VideoStream peer={peer} participant={participant} />
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Controls */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
            <IconButton
              size="large"
              onClick={toggleAudio}
              color={isMuted ? 'default' : 'primary'}
              sx={{ 
                backgroundColor: isMuted ? 'action.disabledBackground' : 'action.selected',
                '&:hover': {
                  backgroundColor: isMuted ? 'action.disabled' : 'primary.dark',
                },
              }}
            >
              {isMuted ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}>
            <IconButton
              size="large"
              onClick={toggleVideo}
              color={isVideoOff ? 'default' : 'primary'}
              sx={{ 
                backgroundColor: isVideoOff ? 'action.disabledBackground' : 'action.selected',
                '&:hover': {
                  backgroundColor: isVideoOff ? 'action.disabled' : 'primary.dark',
                },
              }}
            >
              {isVideoOff ? <VideocamOffIcon /> : <VideocamIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
            <IconButton
              size="large"
              onClick={toggleScreenSharing}
              color={isScreenSharing ? 'secondary' : 'default'}
              sx={{ 
                backgroundColor: isScreenSharing ? 'secondary.light' : 'action.selected',
                '&:hover': {
                  backgroundColor: isScreenSharing ? 'secondary.main' : 'action.hover',
                },
              }}
            >
              {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="End call">
            <IconButton
              size="large"
              onClick={endCall}
              color="error"
              sx={{ 
                backgroundColor: 'error.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'error.dark',
                },
              }}
            >
              <CallEndIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Settings">
            <IconButton
              size="large"
              onClick={handleSettingsClick}
              sx={{ backgroundColor: 'action.selected' }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={settingsAnchorEl}
            open={Boolean(settingsAnchorEl)}
            onClose={handleSettingsClose}
          >
            <MenuItem onClick={() => {
              setMeetingInfoOpen(true);
              handleSettingsClose();
            }}>
              Meeting info
            </MenuItem>
            <MenuItem onClick={handleSettingsClose}>
              Audio settings
            </MenuItem>
            <MenuItem onClick={handleSettingsClose}>
              Video settings
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Participants Dialog */}
      <Dialog
        open={participantsOpen}
        onClose={() => setParticipantsOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Participants ({participants.length})</DialogTitle>
        <DialogContent dividers>
          {participants.map((participant) => (
            <Box
              key={participant._id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Avatar src={participant.profilePicture} alt={participant.username} />
              <Typography sx={{ ml: 2, flexGrow: 1 }}>
                {participant.username}
                {participant._id === meeting?.host?._id && (
                  <Chip
                    label="Host"
                    size="small"
                    color="primary"
                    sx={{ ml: 1 }}
                  />
                )}
                {participant._id === user._id && (
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    (You)
                  </Typography>
                )}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParticipantsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chat</DialogTitle>
        <DialogContent
          dividers
          sx={{
            height: '60vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              mb: 2,
            }}
          >
            {messages.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <Typography color="text.secondary">
                  No messages yet. Start the conversation!
                </Typography>
              </Box>
            ) : (
              messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: message.sender._id === user._id ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 0.5,
                    }}
                  >
                    {message.sender._id !== user._id && (
                      <Avatar
                        src={message.sender.profilePicture}
                        alt={message.sender.username}
                        sx={{ width: 24, height: 24, mr: 1 }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {message.sender._id === user._id
                        ? 'You'
                        : message.sender.username}{' '}
                      • {formatTime(message.timestamp)}
                    </Typography>
                  </Box>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor:
                        message.sender._id === user._id
                          ? 'primary.main'
                          : 'background.default',
                      color:
                        message.sender._id === user._id ? 'white' : 'text.primary',
                    }}
                  >
                    <Typography variant="body2">{message.content}</Typography>
                  </Paper>
                </Box>
              ))
            )}
          </Box>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              sendChatMessage();
            }}
            sx={{
              display: 'flex',
              gap: 1,
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message..."
              size="small"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />
            <Button
              variant="contained"
              disabled={!messageInput.trim()}
              type="submit"
            >
              Send
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Meeting Info Dialog */}
      <Dialog
        open={meetingInfoOpen}
        onClose={() => setMeetingInfoOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Meeting Information</DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" gutterBottom>
            {meeting?.title}
          </Typography>
          {meeting?.description && (
            <Typography variant="body2" paragraph>
              {meeting.description}
            </Typography>
          )}
          <Typography variant="subtitle2" gutterBottom>
            Meeting ID
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={roomId}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Button
                  size="small"
                  onClick={() => navigator.clipboard.writeText(roomId)}
                >
                  Copy
                </Button>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" gutterBottom>
            Host
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Avatar
              src={meeting?.host?.profilePicture}
              alt={meeting?.host?.username}
              sx={{ mr: 1 }}
            />
            <Typography>
              {meeting?.host?.username}
              {meeting?.host?._id === user._id && ' (You)'}
            </Typography>
          </Box>
          <Typography variant="subtitle2" gutterBottom>
            Started
          </Typography>
          <Typography variant="body2" paragraph>
            {meeting?.startTime
              ? new Date(meeting.startTime).toLocaleString()
              : 'N/A'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMeetingInfoOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VideoCall;