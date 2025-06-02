import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Box, Typography, Paper, TextField, IconButton, CircularProgress, Divider } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// GraphQL Queries and Mutations
const GET_CHANNEL_DATA = gql`
  query GetChannelData($channelId: ID!) {
    getChannel(id: $channelId) {
      _id
      name
      description
      type
      members {
        _id
        username
        profilePicture
      }
    }
    getChannelMessages(channelId: $channelId, limit: 50, offset: 0) {
      _id
      content
      sender {
        _id
        username
        profilePicture
      }
      attachments {
        type
        url
        name
      }
      createdAt
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($input: MessageInput!) {
    sendMessage(input: $input) {
      _id
      content
      sender {
        _id
        username
        profilePicture
      }
      createdAt
    }
  }
`;

const ChatRoom = () => {
  const { channelId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [channel, setChannel] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);

  // Get channel data and messages
  const { loading, error, data } = useQuery(GET_CHANNEL_DATA, {
    variables: { channelId },
    fetchPolicy: 'network-only',
  });

  // Send message mutation
  const [sendMessage, { loading: sendLoading }] = useMutation(SEND_MESSAGE);

  // Update messages when data changes
  useEffect(() => {
    if (data?.getChannelMessages) {
      setMessages(data.getChannelMessages);
    }
    if (data?.getChannel) {
      setChannel(data.getChannel);
    }
  }, [data]);

  // Socket.io event handlers
  useEffect(() => {
    if (socket && channelId) {
      // Join channel
      socket.emit('join-channel', channelId);

      // Listen for new messages
      socket.on('new-message', (newMessage) => {
        if (newMessage.channelId === channelId) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      });

      // Listen for typing events
      socket.on('typing', ({ user, channelId: typingChannelId, isTyping }) => {
        if (typingChannelId === channelId) {
          if (isTyping) {
            setTypingUsers((prevUsers) => {
              if (!prevUsers.some((u) => u._id === user._id)) {
                return [...prevUsers, user];
              }
              return prevUsers;
            });
          } else {
            setTypingUsers((prevUsers) => 
              prevUsers.filter((u) => u._id !== user._id)
            );
          }
        }
      });

      // Clean up on unmount
      return () => {
        socket.emit('leave-channel', channelId);
        socket.off('new-message');
        socket.off('typing');
      };
    }
  }, [socket, channelId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message change with typing indicator
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    try {
      await sendMessage({
        variables: {
          input: {
            channelId,
            content: message,
          },
        },
      });
      
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };
  
  // Update socket emission with connection check
  useEffect(() => {
    let typingTimeout;
    
    if (socket && socket.connected && message && channelId) {
      socket.emit('typing', {
        channelId,
        isTyping: true,
      });
      
      // Clear previous timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeout = setTimeout(() => {
        if (socket && socket.connected) {
          socket.emit('typing', {
            channelId,
            isTyping: false,
          });
        }
      }, 2000);
    }
    
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [message, socket, channelId]);

  // Handle message change
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <Typography color="error">
            Error loading chat: {error.message}
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 64px)',
          overflow: 'hidden',
        }}
      >
        {/* Channel Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <Typography variant="h6">#{channel?.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {channel?.description}
          </Typography>
        </Box>

        {/* Messages Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 2,
            backgroundColor: 'background.default',
          }}
        >
          {messages.map((msg) => {
            const isSelf = msg.sender._id === user?._id;
            return (
              <Box 
                key={msg._id} 
                sx={{ 
                  mb: 2,
                  display: 'flex',
                  flexDirection: isSelf ? 'row-reverse' : 'row',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isSelf ? 'flex-end' : 'flex-start',
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
                    <Typography variant="caption" color="text.secondary">
                      {isSelf ? 'You' : msg.sender.username} • {formatTime(msg.createdAt)}
                    </Typography>
                  </Box>
                  <Paper
                    sx={{
                      p: 1.5,
                      backgroundColor: isSelf ? 'primary.main' : 'background.paper',
                      color: isSelf ? 'primary.contrastText' : 'text.primary',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body1">{msg.content}</Typography>
                  </Paper>
                </Box>
              </Box>
            );
          })}

          {typingUsers.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {typingUsers.length === 1
                  ? `${typingUsers[0].username} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </Typography>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Message Input */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            display: 'flex',
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={message}
            onChange={handleMessageChange}
            size="small"
          />
          <IconButton
            color="primary"
            type="submit"
            disabled={!message.trim() || sendLoading}
            sx={{ ml: 1 }}
          >
            {sendLoading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>
    </MainLayout>
  );
};

export default ChatRoom;