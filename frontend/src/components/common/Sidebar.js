// src/components/common/Sidebar.js
import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Toolbar,
  Typography,
  Button,
  Box,
  Badge,
  Avatar,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  Task as TaskIcon,
  Chat as ChatIcon,
  VideoCall as VideoCallIcon,
  Add as AddIcon,
  ExpandMore,
  ExpandLess,
  Explore as ExploreIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Bookmarks as BookmarksIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useQuery, gql } from '@apollo/client';

// GraphQL query for pending invitations
const GET_PENDING_INVITATIONS = gql`
  query GetPendingInvitations {
    getPendingInvitations {
      _id
    }
  }
`;

const drawerWidth = 240;

const Sidebar = ({ open, onClose, variant }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [workspacesOpen, setWorkspacesOpen] = useState(true);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);

  // Get pending invitations
  const { data } = useQuery(GET_PENDING_INVITATIONS, {
    fetchPolicy: 'network-only',
    pollInterval: 60000 // Poll every minute
  });

  const pendingInvitationsCount = data?.getPendingInvitations?.length || 0;

  const handleWorkspaceClick = () => {
    setWorkspacesOpen(!workspacesOpen);
  };

  const handleBookmarksClick = () => {
    setBookmarksOpen(!bookmarksOpen);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const handleWorkspaceSelect = (workspace) => {
    setActiveWorkspace(workspace);
    navigate(`/workspace/${workspace._id}`);
    if (variant === 'temporary') {
      onClose();
    }
  };

  // Fix for Create or Join button not working
  const handleCreateOrJoin = () => {
    // First close the submenu if on mobile
    if (variant === 'temporary') {
      onClose();
    }
    
    // Navigate to dashboard with create tab active
    navigate('/dashboard', { state: { activeTab: 'create' } });
  };

  // Check if the current path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Get avatar initials
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  // Generate avatar color based on workspace name
  const getAvatarColor = (name) => {
    if (!name) return '#3f51b5';
    
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', 
      '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
      '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          <ListItem 
            button 
            onClick={() => handleNavigate('/dashboard')}
            selected={isActive('/dashboard')}
          >
            <ListItemIcon>
              <DashboardIcon color={isActive('/dashboard') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          
          <ListItem 
            button 
            onClick={() => handleNavigate('/explore')}
            selected={isActive('/explore')}
          >
            <ListItemIcon>
              <ExploreIcon color={isActive('/explore') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Explore" />
          </ListItem>

          <ListItem button onClick={handleBookmarksClick}>
            <ListItemIcon>
              <BookmarksIcon />
            </ListItemIcon>
            <ListItemText primary="Bookmarks" />
            {bookmarksOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={bookmarksOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem button sx={{ pl: 4 }}>
                <ListItemText primary="No bookmarks yet" />
              </ListItem>
            </List>
          </Collapse>
        </List>
        
        <Divider />
        
        <List>
          <ListItem button onClick={handleWorkspaceClick}>
            <ListItemIcon>
              <Badge badgeContent={pendingInvitationsCount} color="error">
                <GroupIcon />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Workspaces" />
            {workspacesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={workspacesOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {workspaces.map((workspace) => (
                <ListItem
                  button
                  key={workspace._id}
                  sx={{ pl: 4 }}
                  onClick={() => handleWorkspaceSelect(workspace)}
                  selected={activeWorkspace?._id === workspace._id}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24,
                        fontSize: '0.75rem',
                        bgcolor: getAvatarColor(workspace.name)
                      }}
                    >
                      {getInitials(workspace.name)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary={workspace.name} 
                    primaryTypographyProps={{
                      noWrap: true,
                      style: { textOverflow: 'ellipsis' }
                    }}
                  />
                </ListItem>
              ))}
              <ListItem 
                button 
                sx={{ pl: 4 }} 
                onClick={handleCreateOrJoin}
              >
                <ListItemIcon>
                  <AddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Create or Join" />
              </ListItem>
            </List>
          </Collapse>
        </List>

        {activeWorkspace && (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {activeWorkspace.name}
              </Typography>
            </Box>
            <List>
              <ListItem 
                button 
                onClick={() => handleNavigate(`/workspace/${activeWorkspace._id}`)}
                selected={isActive(`/workspace/${activeWorkspace._id}`)}
              >
                <ListItemIcon>
                  <ChatIcon />
                </ListItemIcon>
                <ListItemText primary="Chat" />
              </ListItem>
              <ListItem 
                button 
                onClick={() => handleNavigate(`/workspace/${activeWorkspace._id}/tasks`)}
                selected={isActive(`/workspace/${activeWorkspace._id}/tasks`)}
              >
                <ListItemIcon>
                  <TaskIcon />
                </ListItemIcon>
                <ListItemText primary="Tasks" />
              </ListItem>
              <ListItem 
                button 
                onClick={() => handleNavigate(`/workspace/${activeWorkspace._id}/meetings`)}
                selected={isActive(`/workspace/${activeWorkspace._id}/meetings`)}
              >
                <ListItemIcon>
                  <VideoCallIcon />
                </ListItemIcon>
                <ListItemText primary="Meetings" />
              </ListItem>
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;