import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  InputAdornment,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, gql } from '@apollo/client';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

// GraphQL Queries and Mutations
const GET_CHANNEL_MESSAGES = gql`
  query GetChannelMessages($channelId: ID!, $limit: Int, $offset: Int) {
    getChannelMessages(channelId: $channelId, limit: $limit, offset: $offset) {
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
      attachments {
        type
        url
        name
      }
      createdAt
    }
  }
`;

const ChatRoom = ({ channelId, channelName }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  // Query channel messages
  const { data, loading, error, fetchMore } = useQuery(GET_CHANNEL_MESSAGES, {
    variables: {
      channelId,
      limit: 50,
      offset: 0,
    },
    fetchPolicy: 'network-only',
  });

  // Send message mutation
  const [sendMessageMutation] = useMutation(SEND_MESSAGE);

  // Update messages when data changes
  useEffect(() => {
    if (data?.getChannelMessages) {
      setMessages(data.getChannelMessages);
    }
  }, [data]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket event handlers
  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on('new_message', (newMessage) => {
        if (newMessage.channelId === channelId) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      });

      // Listen for typing events
      socket.on('typing', ({ user, channelId: typingChannelId, isTyping }) => {
        if (typingChannelId === channelId && user._id !== user?._id) {
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
        socket.off('new_message');
        socket.off('typing');
      };
    }
  }, [socket, channelId, user]);

  // Handle typing indicator
  useEffect(() => {
    let typingTimeout;
    
    if (socket && message && !isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        channelId,
        isTyping: true,
      });
    }
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    typingTimeout = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing', {
          channelId,
          isTyping: false,
        });
      }
    }, 2000);
    
    return () => {
      clearTimeout(typingTimeout);
    };
  }, [message, isTyping, socket, channelId]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle message change
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  // Handle message submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    try {
      await sendMessageMutation({
        variables: {
          input: {
            channelId,
            content: message,
            attachments: [],
          },
        },
      });
      
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group messages by date
  const groupMessagesByDate = (msgs) => {
    const grouped = {};
    
    msgs.forEach((msg) => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(msg);
    });
    
    return grouped;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        maxHeight: 'calc(100vh - 64px)',
        overflow: 'hidden',
      }}
    >
      {/* Channel Header */}
      <Box 
        sx={{ 
          px: 2, 
          py: 1.5, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography variant="h6">{channelName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {messages.length} messages
          </Typography>
        </Box>
        <IconButton>
          <MoreVertIcon />
        </IconButton>
      </Box>

      {/* Messages Area */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <Box key={date}>
            <Divider sx={{ my: 2 }}>
              <Chip label={date} size="small" />
            </Divider>
            
            <List>
              {dateMessages.map((msg) => {
                const isSelf = msg.sender._id === user?._id;
                
                return (
                  <ListItem
                    key={msg._id}
                    alignItems="flex-start"
                    sx={{
                      justifyContent: isSelf ? 'flex-end' : 'flex-start',
                      px: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: isSelf ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        maxWidth: '70%',
                      }}
                    >
                      {!isSelf && (
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar
                            src={msg.sender.profilePicture}
                            alt={msg.sender.username}
                            sx={{ width: 32, height: 32 }}
                          />
                        </ListItemAvatar>
                      )}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          backgroundColor: isSelf
                            ? 'primary.main'
                            : 'background.default',
                          color: isSelf ? 'white' : 'text.primary',
                          borderRadius: 2,
                          ml: isSelf ? 0 : 1,
                          mr: isSelf ? 1 : 0,
                        }}
                      >
                        {!isSelf && (
                          <Typography
                            variant="subtitle2"
                            component="div"
                            color={isSelf ? 'inherit' : 'text.secondary'}
                          >
                            {msg.sender.username}
                          </Typography>
                        )}
                        <Typography variant="body1">{msg.content}</Typography>
                        <Typography
                          variant="caption"
                          color={isSelf ? 'rgba(255,255,255,0.7)' : 'text.secondary'}
                          sx={{
                            display: 'block',
                            textAlign: 'right',
                            mt: 0.5,
                          }}
                        >
                          {formatTime(msg.createdAt)}
                        </Typography>
                      </Paper>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}

        {typingUsers.length > 0 && (
          <Box sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
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
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={message}
          onChange={handleMessageChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Tooltip title="Attach file">
                  <IconButton edge="start">
                    <AttachFileIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Add emoji">
                  <IconButton edge="end">
                    <EmojiIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Send">
                  <IconButton
                    edge="end"
                    color="primary"
                    type="submit"
                    disabled={!message.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default ChatRoom;