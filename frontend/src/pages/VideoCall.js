import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Checkbox,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  CallEnd as CallEndIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  PersonAdd as PersonAddIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import VideoError from '../components/video/VideoError';
import VideoSettings from '../components/video/VideoSettings';
import { useWorkspace } from '../context/WorkspaceContext';
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

const LEAVE_MEETING = gql`
  mutation LeaveMeeting($meetingId: ID!) {
    leaveMeeting(meetingId: $meetingId)
  }
`;

const GET_WORKSPACE_MEMBERS = gql`
  query GetWorkspaceMembers($workspaceId: ID!) {
    getWorkspaceMembers(workspaceId: $workspaceId) {
      _id
      username
      email
      profilePicture
    }
  }
`;

const SEND_MEETING_INVITE = gql`
  mutation SendMeetingInvite($meetingId: ID!, $userIds: [ID!]!) {
    sendMeetingInvite(meetingId: $meetingId, userIds: $userIds)
  }
`;

const VideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { leaveMeeting, fetchMeetings } = useWorkspace();
  
  // State
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [error, setError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewStream, setPreviewStream] = useState(null);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [showEndCallDialog, setShowEndCallDialog] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isExiting, setIsExiting] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Refs
  const userVideo = useRef();
  const peersRef = useRef({});
  const localStreamRef = useRef();
  const isCleanedUp = useRef(false);
  
  // Get meeting details
  const { loading, error: queryError, data } = useQuery(GET_MEETING_DETAILS, {
    variables: { meetingId: roomId },
    fetchPolicy: 'network-only',
  });

  // Get workspace members
  const { data: membersData } = useQuery(GET_WORKSPACE_MEMBERS, {
    variables: { workspaceId: data?.getMeetingDetails?.workspaceId },
    skip: !data?.getMeetingDetails?.workspaceId,
    onCompleted: (data) => {
      if (data?.getWorkspaceMembers) {
        setWorkspaceMembers(data.getWorkspaceMembers.filter(
          member => member._id !== user?._id && 
          !participants.some(p => p._id === member._id)
        ));
      }
    }
  });
  
  // Join meeting mutation
  const [joinMeeting] = useMutation(JOIN_MEETING);
  
  // End meeting mutation
  const [endMeeting] = useMutation(END_MEETING);
  
  // Leave meeting mutation
  const [leaveMeetingMutation] = useMutation(LEAVE_MEETING);

  // Send meeting invite mutation
  const [sendMeetingInvite, { loading: inviteLoading }] = useMutation(SEND_MEETING_INVITE);
  
  // Get participants from meeting data
  const meeting = data?.getMeetingDetails;
  const participants = meeting?.participants || [];
  
  // Function to clean up media tracks and connections
  const cleanupMedia = () => {
    if (isCleanedUp.current) return;
    
    console.log('Cleaning up media and connections');
    
    // Stop all tracks in local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        try {
          track.stop();
          console.log(`Stopped local ${track.kind} track`);
        } catch (err) {
          console.error(`Error stopping ${track.kind} track:`, err);
        }
      });
      setLocalStream(null);
    }
    
    // Stop all tracks in screen share stream
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        try {
          track.stop();
          console.log(`Stopped screen ${track.kind} track`);
        } catch (err) {
          console.error(`Error stopping screen ${track.kind} track:`, err);
        }
      });
      setScreenStream(null);
    }
    
    // Destroy all peer connections
    Object.values(peersRef.current).forEach(({ peer }) => {
      if (peer) {
        try {
          peer.destroy();
        } catch (err) {
          console.error('Error destroying peer:', err);
        }
      }
    });
    
    isCleanedUp.current = true;
  };
  
  // Handle navigation and reload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      cleanupMedia();
      e.returnValue = '';
      return '';
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Final cleanup before component is unmounted
      cleanupMedia();
      leaveMeeting();
    };
  }, [leaveMeeting]);
  
  // Initialize call
  useEffect(() => {
    if (data?.getMeetingDetails && socket && isConnected && !isExiting && !isCleanedUp.current) {
      const initCall = async () => {
        try {
          // Join meeting
          await joinMeeting({
            variables: { meetingId: roomId },
          });
          
          // Get user media with explicit constraints
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            },
            audio: true,
          });
          
          // Explicitly set the stream to the video element
          if (userVideo.current) {
            userVideo.current.srcObject = stream;
            // Force play the video
            userVideo.current.play().catch(err => {
              console.error("Error playing video:", err);
            });
          }
          
          setLocalStream(stream);
          localStreamRef.current = stream;
          
          // Join room
          socket.emit('join-room', {
            roomId,
            userId: user._id,
          });
          
          // Listen for events
          socket.on('user-joined', handleUserJoined);
          socket.on('user-left', handleUserLeft);
          socket.on('receiving-signal', handleReceivingSignal);
          socket.on('receiving-returned-signal', handleReceivingReturnedSignal);
          socket.on('chat-message', handleChatMessage);
          socket.on('existing-peers', handleExistingPeers);
        } catch (err) {
          console.error('Error initializing call:', err);
          setError(err);
        }
      };
      
      initCall();
      
      // Return cleanup for this effect
      return () => {
        // Remove socket listeners
        if (socket) {
          socket.off('user-joined');
          socket.off('user-left');
          socket.off('receiving-signal');
          socket.off('receiving-returned-signal');
          socket.off('chat-message');
          socket.off('existing-peers');
        }
      };
    }
  }, [data, socket, isConnected, roomId, user, joinMeeting, isExiting]);
  
  // Handle existing peers in room
  const handleExistingPeers = ({ peers }) => {
    peers.forEach(peerId => {
      if (localStreamRef.current) {
        const peer = createPeer(peerId, user._id, localStreamRef.current);
        peersRef.current[peerId] = {
          peer,
          userId: peerId,
        };
        
        setPeers(prev => ({
          ...prev,
          [peerId]: peer,
        }));
      }
    });
  };
  
  // Handle new user joined
  const handleUserJoined = ({ userId }) => {
    if (localStream) {
      const peer = createPeer(userId, user._id, localStream);
      peersRef.current[userId] = {
        peer,
        userId,
      };
      
      setPeers(prev => ({
        ...prev,
        [userId]: peer,
      }));
    }
  };
  
  // Handle user left
  const handleUserLeft = ({ userId }) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].peer.destroy();
      delete peersRef.current[userId];
      
      setPeers(prev => {
        const peers = { ...prev };
        delete peers[userId];
        return peers;
      });
    }
  };
  
  // Handle receiving signal
  const handleReceivingSignal = ({ userId, signal }) => {
    if (localStream) {
      const peer = addPeer(userId, signal, localStream);
      peersRef.current[userId] = {
        peer,
        userId,
      };
      
      setPeers(prev => ({
        ...prev,
        [userId]: peer,
      }));
    }
  };
  
  // Handle receiving returned signal
  const handleReceivingReturnedSignal = ({ userId, signal }) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].peer.signal(signal);
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
      if (socket && socket.connected) {
        socket.emit('sending-signal', {
          receiverId,
          senderId,
          signal,
        });
      }
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
      if (socket && socket.connected) {
        socket.emit('returning-signal', {
          receiverId: senderId,
          senderId: user._id,
          signal,
        });
      }
    });
    
    peer.signal(incomingSignal);
    
    return peer;
  };

  // Handle sending invites to meeting
  const handleSendInvites = async () => {
    if (!selectedMembers.length) return;
    
    try {
      await sendMeetingInvite({
        variables: {
          meetingId: roomId,
          userIds: selectedMembers
        }
      });
      
      setInviteDialogOpen(false);
      setSelectedMembers([]);
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Invitations sent successfully',
        severity: 'success'
      });
      
      // Refresh the workspace members list to remove invited users
      if (membersData?.getWorkspaceMembers) {
        const updatedMembers = membersData.getWorkspaceMembers.filter(
          member => member._id !== user?._id && 
          !participants.some(p => p._id === member._id) &&
          !selectedMembers.includes(member._id)
        );
        setWorkspaceMembers(updatedMembers);
      }
    } catch (err) {
      console.error('Error sending invites:', err);
      setNotification({
        open: true,
        message: err.message || 'Failed to send invitations',
        severity: 'error'
      });
    }
  };

  // Apply device settings
  const handleApplySettings = async (settings) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: settings.videoInput ? { deviceId: settings.videoInput } : true,
        audio: settings.audioInput ? { deviceId: settings.audioInput } : true,
      });
      
      // Replace tracks in all peer connections
      Object.values(peersRef.current).forEach(({ peer }) => {
        if (peer) {
          newStream.getTracks().forEach(track => {
            const senders = peer._senders || [];
            const sender = senders.find(s => s.track?.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track).catch(err => {
                console.error(`Error replacing ${track.kind} track:`, err);
              });
            }
          });
        }
      });
      
      // Update local video
      if (userVideo.current) {
        userVideo.current.srcObject = newStream;
      }
      
      // Stop old stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      setLocalStream(newStream);
      localStreamRef.current = newStream;
      
    } catch (err) {
      console.error('Error applying device settings:', err);
      setError(err);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
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
          video: {
            cursor: 'always'
          },
          audio: false
        });
        
        // Get the video track from screen capture
        const screenVideoTrack = stream.getVideoTracks()[0];
        
        // Replace video track with screen track in all peer connections
        Object.values(peersRef.current).forEach(({ peer }) => {
          if (peer) {
            const senders = peer._senders || [];
            const sender = senders.find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(screenVideoTrack).catch(err => {
                console.error('Error replacing video track with screen:', err);
              });
            }
          }
        });
        
        // Update local video display
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }
        
        // Save screen stream for cleanup
        setScreenStream(stream);
        setIsScreenSharing(true);
        
        // Handle screen share ended by user (browser UI)
        screenVideoTrack.onended = () => {
          stopScreenSharing();
        };
        
        // Notify others through socket
        if (socket && socket.connected) {
          socket.emit('start-screen-share', {
            roomId,
            userId: user._id,
          });
        }
      } catch (err) {
        console.error('Error sharing screen:', err);
        setError({
          name: 'Screen Sharing Error',
          message: err.message || 'Failed to share screen'
        });
      }
    } else {
      stopScreenSharing();
    }
  };
  
  // Stop screen sharing
  const stopScreenSharing = () => {
    if (screenStream) {
      // Stop all tracks in the screen stream
      screenStream.getTracks().forEach(track => {
        track.stop();
      });
      
      // If local stream exists, restore it
      if (localStream) {
        // Get the original video track
        const videoTrack = localStream.getVideoTracks()[0];
        
        // Replace screen track with original video track in all peers
        if (videoTrack) {
          Object.values(peersRef.current).forEach(({ peer }) => {
            if (peer) {
              const senders = peer._senders || [];
              const sender = senders.find(s => s.track?.kind === 'video');
              if (sender) {
                sender.replaceTrack(videoTrack).catch(err => {
                  console.error('Error replacing screen with video track:', err);
                });
              }
            }
          });
          
          // Restore local video display
          if (userVideo.current) {
            userVideo.current.srcObject = localStream;
          }
        }
      }
      
      setScreenStream(null);
      setIsScreenSharing(false);
      
      // Notify others via socket
      if (socket && socket.connected) {
        socket.emit('stop-screen-share', {
          roomId,
          userId: user._id,
        });
      }
    }
  };

  // End call
  const handleEndCall = async () => {
    setIsExiting(true);
    
    try {
      // First, ensure all tracks are stopped
      cleanupMedia();
      
      // Record we're leaving (for participants) or ending (for host) the meeting
      const isHost = meeting?.host?._id === user?._id;
      
      if (isHost) {
        try {
          await endMeeting({
            variables: { meetingId: roomId }
          });
        } catch (endError) {
          console.error('Error ending meeting (continuing with exit):', endError);
        }
      } else {
        try {
          await leaveMeetingMutation({
            variables: { meetingId: roomId }
          });
        } catch (leaveError) {
          console.error('Error leaving meeting (continuing with exit):', leaveError);
        }
      }
      
      // Signal to the workspace context that we've left
      leaveMeeting();
      
      // Refresh meetings list
      fetchMeetings();
      
      // Navigate back to workspace
      navigate(`/workspace/${data?.getMeetingDetails?.workspaceId}`);
    } catch (err) {
      console.error('Error ending call:', err);
      
      // Even if there's an error with the backend, clean up media and force navigation
      cleanupMedia();
      leaveMeeting();
      navigate(`/workspace/${data?.getMeetingDetails?.workspaceId}`);
    }
  };
  
  // Handle chat message
  const handleChatMessage = (data) => {
    setMessages(prevMessages => [...prevMessages, data]);
  };
  
  // Send chat message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !socket || !socket.connected) return;
    
    // Emit chat message event
    socket.emit('send-chat-message', {
      roomId,
      userId: user._id,
      username: user.username,
      message: messageInput,
      timestamp: new Date().toISOString(),
    });
    
    // Add message to local state
    setMessages(prevMessages => [
      ...prevMessages,
      {
        userId: user._id,
        username: user.username,
        message: messageInput,
        timestamp: new Date().toISOString(),
        isSelf: true,
      }
    ]);
    
    setMessageInput('');
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (queryError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Error loading meeting: {queryError.message}
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
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#121212' }}>
      {/* Call Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
        }}
      >
        <Typography variant="h6">{meeting?.title || 'Video Call'}</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => setParticipantsOpen(true)}
            sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)', mr: 1 }}
          >
            Participants ({participants.length})
          </Button>
          <Button
            variant="outlined"
            startIcon={<ChatIcon />}
            onClick={() => setChatOpen(true)}
            sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)' }}
          >
            Chat
          </Button>
        </Box>
      </Box>
      
      {/* Video Grid */}
      <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto', backgroundColor: '#1a1a1a' }}>
        <Grid container spacing={2}>
          {/* Local Video */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              sx={{
                position: 'relative',
                paddingTop: '56.25%', // 16:9 aspect ratio
                backgroundColor: 'black',
                overflow: 'hidden',
                borderRadius: 1
              }}
            >
              <video
                ref={userVideo}
                autoPlay
                muted
                playsInline
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 0,
                  backgroundColor: 'black'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  zIndex: 1
                }}
              >
                You {isMuted && '(Muted)'} {isVideoOff && '(Camera Off)'}
              </Box>
            </Paper>
          </Grid>
          
          {/* Peer videos */}
          {Object.keys(peers).map(peerId => {
            const participant = participants.find(p => p._id === peerId);
            return (
              <Grid item xs={12} sm={6} md={4} key={peerId}>
                <PeerVideo peer={peers[peerId]} participant={participant} />
              </Grid>
            );
          })}
          
          {/* Empty state for no other participants */}
          {Object.keys(peers).length === 0 && (
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                sx={{
                  position: 'relative',
                  paddingTop: '56.25%',
                  backgroundColor: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  borderRadius: 1
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    width: '80%'
                  }}
                >
                  Waiting for others to join...
                  <Button
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setInviteDialogOpen(true)}
                    size="small"
                    sx={{ 
                      mt: 2, 
                      color: 'white', 
                      borderColor: 'white',
                      '&:hover': {
                        borderColor: 'primary.main',
                      }
                    }}
                  >
                    Invite Others
                  </Button>
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
      
      {/* Call Controls */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}
      >
        <IconButton
          onClick={toggleAudio}
          sx={{
            backgroundColor: isMuted ? 'error.main' : 'success.main',
            color: 'white',
            '&:hover': {
              backgroundColor: isMuted ? 'error.dark' : 'success.dark',
            },
          }}
        >
          {isMuted ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
        
        <IconButton
          onClick={toggleVideo}
          sx={{
            backgroundColor: isVideoOff ? 'error.main' : 'success.main',
            color: 'white',
            '&:hover': {
              backgroundColor: isVideoOff ? 'error.dark' : 'success.dark',
            },
          }}
        >
          {isVideoOff ? <VideocamOffIcon /> : <VideocamIcon />}
        </IconButton>
        
        <IconButton
          onClick={toggleScreenSharing}
          sx={{
            backgroundColor: isScreenSharing ? 'warning.main' : 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: isScreenSharing ? 'warning.dark' : 'primary.dark',
            },
          }}
        >
          {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
        </IconButton>
        
        <IconButton
          onClick={() => setInviteDialogOpen(true)}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          <PersonAddIcon />
        </IconButton>

        <IconButton
          onClick={() => setShowEndCallDialog(true)}
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

        <IconButton
          onClick={() => setSettingsOpen(true)}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Box>
      
      {/* Chat Dialog */}
      <Dialog
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            height: '70vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle>
          Chat
          <IconButton
            onClick={() => setChatOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            overflowY: 'auto',
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'text.secondary',
              }}
            >
              <Typography>No messages yet</Typography>
            </Box>
          ) : (
            messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  alignSelf: msg.isSelf ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {msg.isSelf ? 'You' : msg.username}
                </Typography>
                <Paper
                  sx={{
                    p: 1.5,
                    backgroundColor: msg.isSelf ? 'primary.main' : 'background.paper',
                    color: msg.isSelf ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  <Typography variant="body2">{msg.message}</Typography>
                </Paper>
              </Box>
            ))
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box
            component="form"
            sx={{ display: 'flex', width: '100%' }}
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              sx={{ mr: 1 }}
            />
            <IconButton
              color="primary"
              type="submit"
              disabled={!messageInput.trim()}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Participants Dialog */}
      <Dialog
        open={participantsOpen}
        onClose={() => setParticipantsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Participants ({participants.length})
          <IconButton
            onClick={() => setParticipantsOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <List>
            {participants.map((participant) => (
              <ListItem key={participant._id}>
                <ListItemAvatar>
                  <Avatar src={participant.profilePicture}>
                    {participant.username.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {participant.username}
                      {participant._id === meeting?.host?._id && (
                        <Chip size="small" color="primary" label="Host" sx={{ ml: 1 }} />
                      )}
                      {participant._id === user._id && (
                        <Chip size="small" variant="outlined" label="You" sx={{ ml: 1 }} />
                      )}
                    </Box>
                  } 
                />
              </ListItem>
            ))}
            {participants.length === 0 && (
              <ListItem>
                <ListItemText primary="No participants yet" />
              </ListItem>
            )}
          </List>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => {
                setParticipantsOpen(false);
                setInviteDialogOpen(true);
              }}
            >
              Invite More People
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Invite to Meeting
          <IconButton
            onClick={() => setInviteDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <Typography variant="body2" paragraph>
            Select team members to invite to this meeting:
          </Typography>
          
          {workspaceMembers.length > 0 ? (
            <List>
              {workspaceMembers.map((member) => (
                <ListItem key={member._id}>
                  <ListItemAvatar>
                    <Avatar src={member.profilePicture}>
                      {member.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={member.username} 
                    secondary={member.email} 
                  />
                  <Checkbox
                    edge="end"
                    checked={selectedMembers.includes(member._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers([...selectedMembers, member._id]);
                      } else {
                        setSelectedMembers(selectedMembers.filter(id => id !== member._id));
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography color="text.secondary">
                No other workspace members available to invite.
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleSendInvites}
            disabled={selectedMembers.length === 0 || inviteLoading}
            startIcon={inviteLoading ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {inviteLoading 
              ? 'Sending Invites...' 
              : `Send Invites${selectedMembers.length ? ` (${selectedMembers.length})` : ''}`
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* End Call Confirmation Dialog */}
      <Dialog
        open={showEndCallDialog}
        onClose={() => setShowEndCallDialog(false)}
      >
        <DialogTitle>End Video Call</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to end this call? Your camera and microphone will be turned off.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndCallDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setShowEndCallDialog(false);
              handleEndCall();
            }} 
            color="error" 
            variant="contained" 
            autoFocus
          >
            End Call
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <VideoError
        open={!!error}
        error={error}
        onClose={() => setError(null)}
        onRetry={() => {
          setError(null);
          window.location.reload();
        }}
      />
      
      {/* Settings Dialog */}
      <VideoSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onApply={handleApplySettings}
        previewStream={previewStream}
        setPreviewStream={setPreviewStream}
      />
      
      {/* Notification Snackbar */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={() => setNotification({...notification, open: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification({...notification, open: false})} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Peer Video Component
const PeerVideo = ({ peer, participant }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (!peer) return;

    peer.on('stream', (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Force play the video
        videoRef.current.play().catch(err => {
          console.error("Error playing peer video:", err);
        });
      }
    });

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => {
          try {
            track.stop();
          } catch (err) {
            console.error('Error stopping peer video track:', err);
          }
        });
        videoRef.current.srcObject = null;
      }
    };
  }, [peer]);

  return (
    <Paper
      sx={{
        position: 'relative',
        paddingTop: '56.25%', // 16:9 aspect ratio
        backgroundColor: 'black',
        overflow: 'hidden',
        borderRadius: 1
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: 1,
          fontSize: '0.75rem',
          zIndex: 1
        }}
      >
        {participant?.username || 'Participant'}
      </Box>
    </Paper>
  );
};

export default VideoCall;