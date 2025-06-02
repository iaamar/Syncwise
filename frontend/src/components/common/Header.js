// src/components/common/Header.js
import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Box,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
  VideoCall as VideoCallIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, gql } from '@apollo/client';
import { useSocket } from '../../context/SocketContext';

// GraphQL query to get pending invitations
const GET_PENDING_INVITATIONS = gql`
  query GetPendingNotifications {
    getPendingInvitations {
      _id
      workspace {
        _id
        name
      }
      invitedBy {
        _id
        username
      }
      createdAt
    }
    getUnreadNotificationsCount
  }
`;

const Header = ({ onDrawerToggle, notificationCount = 0 }) => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [meetingInvites, setMeetingInvites] = useState([]);
  
  // Get pending invitations for notification menu
  const { data: notificationData, refetch: refetchNotifications } = useQuery(GET_PENDING_INVITATIONS, {
    fetchPolicy: 'network-only',
    pollInterval: 60000 // Poll every minute
  });
  
  const pendingInvitations = notificationData?.getPendingInvitations || [];
  const unreadCount = (notificationData?.getUnreadNotificationsCount || 0) + pendingInvitations.length + meetingInvites.length;
  
  // Listen for meeting invites
  useEffect(() => {
    if (socket && socket.connected) {
      socket.on('meeting-invite', (invite) => {
        console.log('Received meeting invite:', invite);
        setMeetingInvites(prev => [invite, ...prev]);
      });
      
      return () => {
        socket.off('meeting-invite');
      }
    }
  }, [socket]);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
    refetchNotifications();
  };
  
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleNavigate = (path) => {
    navigate(path);
    handleMenuClose();
  };
  
  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/logout');
  };
  
  // Join meeting from invite
  const handleJoinMeeting = (meetingId) => {
    handleNotificationsClose();
    // Remove from invites list
    setMeetingInvites(prev => prev.filter(invite => invite.meetingId !== meetingId));
    // Navigate to meeting
    navigate(`/video/${meetingId}`);
  };
  
  // Format date for notifications
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    
    const months = Math.floor(days / 30);
    return `${months} months ago`;
  };
  
  // Generate avatar color and initials
  const generateAvatarColor = (username) => {
    if (!username) return '#3f51b5';
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };
  
  const getInitials = (username) => {
    if (!username) return '?';
    const parts = username.split(/[\s._-]/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <AppBar position="fixed" color="default" elevation={1} sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {/* Menu Button (Mobile Only) */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { sm: 'flex', md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        {/* Logo */}
        <Typography
          component="div"
          variant="h6"
          sx={{
            background: 'linear-gradient(90deg, #3f51b5 0%, #f50057 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          SyncWise
        </Typography>
        
        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Navigation for larger screens */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              color="inherit" 
              startIcon={<DashboardIcon />}
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          </Box>
        )}
        
        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            color="inherit"
            aria-label="show notifications"
            onClick={handleNotificationsOpen}
            size="large"
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        
        {/* Profile Menu */}
        <Box sx={{ ml: 1 }}>
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
            >
              {user?.profilePicture ? (
                <Avatar 
                  src={user.profilePicture} 
                  alt={user.username}
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: generateAvatarColor(user?.username) 
                  }}
                >
                  {getInitials(user?.username)}
                </Avatar>
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
      
      {/* Profile Menu Items */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            width: 200,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
      >
        <MenuItem onClick={() => handleNavigate('/profile')}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigate('/profile')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleNavigate('/profile')}>
          <ListItemIcon>
            <HelpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Help" />
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        id="notifications-menu"
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            width: 320,
            maxHeight: 450,
            overflowY: 'auto'
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
        </Box>
        
        {/* Meeting Invites */}
        {meetingInvites.length > 0 && (
          <>
            {meetingInvites.map((invite) => (
              <MenuItem 
                key={`meeting-${invite.meetingId}`} 
                onClick={() => handleJoinMeeting(invite.meetingId)}
                sx={{ 
                  borderLeft: '4px solid',
                  borderColor: 'secondary.main',
                  bgcolor: 'rgba(245, 0, 87, 0.05)'
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <VideoCallIcon color="secondary" fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      Meeting Invite: {invite.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    <strong>{invite.inviter?.username || invite.host?.username}</strong> invited you to join a meeting
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {formatTimeAgo(invite.timestamp)}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
            <Divider />
          </>
        )}
        
        {/* Workspace Invitations */}
        {pendingInvitations.length > 0 ? (
          <>
            {pendingInvitations.map((invitation) => (
              <MenuItem 
                key={invitation._id} 
                onClick={() => {
                  handleNotificationsClose();
                  navigate('/invitations');
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2">
                    <strong>{invitation.invitedBy.username}</strong> invited you to join <strong>{invitation.workspace.name}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimeAgo(invitation.createdAt)}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button 
                color="primary" 
                size="small" 
                onClick={() => {
                  navigate('/invitations');
                  handleNotificationsClose();
                }}
              >
                View all invitations
              </Button>
            </Box>
          </>
        ) : (
          <>
            {meetingInvites.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No new notifications
                </Typography>
              </Box>
            )}
          </>
        )}
      </Menu>
    </AppBar>
  );
};

export default Header;