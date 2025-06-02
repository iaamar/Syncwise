// src/pages/Dashboard.js (updated)
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  Avatar,
  AvatarGroup,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  IconButton,
  Tooltip,
  Tab,
  Tabs
} from '@mui/material';
import {
  Add as AddIcon,
  Chat as ChatIcon,
  Task as TaskIcon,
  Event as EventIcon,
  WorkOutline as WorkOutlineIcon,
  Dashboard as DashboardIcon,
  Bookmarks as BookmarksIcon,
  Star as StarIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import MainLayout from '../layouts/MainLayout';
import { useWorkspace } from '../context/WorkspaceContext';
import PendingInvitations from '../components/dashboard/PendingInvitations';

// GraphQL Queries and Mutations
const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    getUserWorkspaces {
      _id
      name
      description
      members {
        userId
        role
      }
      owner {
        _id
        username
        profilePicture
      }
      createdAt
    }
    getRecentActivities {
      _id
      type
      title
      content
      createdAt
      workspace {
        _id
        name
      }
      user {
        _id
        username
        profilePicture
      }
    }
    getUpcomingMeetings {
      _id
      title
      description
      startTime
      participants {
        _id
        username
        profilePicture
      }
    }
  }
`;

const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace($input: WorkspaceInput!) {
    createWorkspace(input: $input) {
      _id
      name
      description
    }
  }
`;

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState(0);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: '',
  });
  const [workspaceFilter, setWorkspaceFilter] = useState('all'); // 'all', 'owned', 'joined'

  // Query dashboard data
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_DATA, {
    fetchPolicy: 'network-only',
  });

  // Create workspace mutation
  const [createWorkspaceMutation, { loading: createLoading }] = useMutation(
    CREATE_WORKSPACE,
    {
      onCompleted: () => {
        setCreateWorkspaceOpen(false);
        refetch();
      },
    }
  );

  // Check for state passed from sidebar navigation
  useEffect(() => {
    if (location.state?.activeTab === 'create') {
      handleOpenCreateWorkspace();
    }
  }, [location]);

  // Format date function to handle invalid dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  // Handle workspace click
  const handleWorkspaceClick = (workspace) => {
    setActiveWorkspace(workspace);
    navigate(`/workspace/${workspace._id}`);
  };

  // Handle create workspace dialog
  const handleOpenCreateWorkspace = () => {
    setCreateWorkspaceOpen(true);
  };

  const handleCloseCreateWorkspace = () => {
    setCreateWorkspaceOpen(false);
  };

  const handleCreateWorkspaceChange = (e) => {
    setNewWorkspace({
      ...newWorkspace,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name) return;

    try {
      await createWorkspaceMutation({
        variables: {
          input: {
            name: newWorkspace.name,
            description: newWorkspace.description,
          },
        },
      });

      // Reset form
      setNewWorkspace({
        name: '',
        description: '',
      });
    } catch (err) {
      console.error('Error creating workspace:', err);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle workspace filter change
  const handleFilterChange = (filter) => {
    setWorkspaceFilter(filter);
  };

  // Extract data for rendering
  const workspaces = data?.getUserWorkspaces || [];
  const recentActivities = data?.getRecentActivities || [];
  const upcomingMeetings = data?.getUpcomingMeetings || [];

  // Filter workspaces based on selected filter
  const filteredWorkspaces = workspaces.filter(workspace => {
    if (workspaceFilter === 'all') return true;
    if (workspaceFilter === 'owned') return workspace.owner._id === localStorage.getItem('userId');
    if (workspaceFilter === 'joined') return workspace.owner._id !== localStorage.getItem('userId');
    return true;
  });

  // Calculate workspace stats
  const totalWorkspaces = workspaces.length;
  const ownedWorkspaces = workspaces.filter(w => w.owner._id === localStorage.getItem('userId')).length;
  const joinedWorkspaces = totalWorkspaces - ownedWorkspaces;

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Dashboard Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4">Dashboard</Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back! Here's an overview of your workspaces and activities.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateWorkspace}
          >
            Create Workspace
          </Button>
        </Box>

        {/* Pending Invitations Section */}
        <PendingInvitations />

        {/* Dashboard Tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<WorkOutlineIcon />} label="Workspaces" />
            <Tab icon={<DashboardIcon />} label="Activity" />
            <Tab icon={<EventIcon />} label="Meetings" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <>
            {/* Workspace Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h3" color="primary">{totalWorkspaces}</Typography>
                  <Typography variant="body1">Total Workspaces</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h3" color="secondary">{ownedWorkspaces}</Typography>
                  <Typography variant="body1">Owned Workspaces</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h3" color="success.main">{joinedWorkspaces}</Typography>
                  <Typography variant="body1">Joined Workspaces</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Workspace Filters */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ mr: 2 }}>Filter by:</Typography>
                <Button 
                  variant={workspaceFilter === 'all' ? 'contained' : 'outlined'} 
                  size="small" 
                  onClick={() => handleFilterChange('all')}
                  sx={{ mr: 1 }}
                >
                  All
                </Button>
                <Button 
                  variant={workspaceFilter === 'owned' ? 'contained' : 'outlined'} 
                  size="small" 
                  onClick={() => handleFilterChange('owned')}
                  sx={{ mr: 1 }}
                >
                  Owned
                </Button>
                <Button 
                  variant={workspaceFilter === 'joined' ? 'contained' : 'outlined'} 
                  size="small" 
                  onClick={() => handleFilterChange('joined')}
                >
                  Joined
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Search workspaces">
                  <IconButton size="small" sx={{ mr: 1 }}>
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sort workspaces">
                  <IconButton size="small">
                    <SortIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Workspaces Grid */}
            <Grid container spacing={3}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredWorkspaces.length > 0 ? (
                filteredWorkspaces.map((workspace) => (
                  <Grid item xs={12} sm={6} md={4} key={workspace._id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                      }}
                      onClick={() => handleWorkspaceClick(workspace)}
                    >
                      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            {workspace.name}
                          </Typography>
                          {workspace.owner._id === localStorage.getItem('userId') && (
                            <Chip size="small" color="primary" label="Owner" />
                          )}
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          minHeight: '40px'
                        }}>
                          {workspace.description || "No description provided."}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Tooltip title={workspace.owner.username}>
                            <Avatar 
                              src={workspace.owner.profilePicture} 
                              sx={{ width: 24, height: 24, mr: 1 }}
                            >
                              {workspace.owner.username.charAt(0).toUpperCase()}
                            </Avatar>
                          </Tooltip>
                          <Typography variant="body2" color="text.secondary">
                            Created {formatDate(workspace.createdAt)}
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <Box sx={{ px: 2, pb: 1 }}>
                        <AvatarGroup 
                          max={5} 
                          sx={{ 
                            justifyContent: 'flex-start',
                            '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem' } 
                          }}
                        >
                          <Avatar 
                            alt={workspace.owner.username} 
                            src={workspace.owner.profilePicture || ''}
                            sx={{ width: 28, height: 28 }}
                          >
                            {workspace.owner.username.charAt(0).toUpperCase()}
                          </Avatar>
                          {workspace.members.slice(0, 4).map((member, idx) => (
                            <Avatar 
                              key={idx}
                              alt={`Member ${idx+1}`} 
                              sx={{ width: 28, height: 28 }}
                            />
                          ))}
                        </AvatarGroup>
                      </Box>
                      
                      <Divider />
                      
                      <CardActions>
                        <Button size="small" startIcon={<ChatIcon />}>
                          Chat
                        </Button>
                        <Button size="small" startIcon={<TaskIcon />}>
                          Tasks
                        </Button>
                        <Box sx={{ flexGrow: 1 }} />
                        <Tooltip title="Bookmark workspace">
                          <IconButton size="small">
                            <BookmarksIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      You don't have any {workspaceFilter !== 'all' ? workspaceFilter : ''} workspaces yet.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{ mt: 2 }}
                      onClick={handleOpenCreateWorkspace}
                    >
                      Create Workspace
                    </Button>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </>
        )}

        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Recent Activity
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {recentActivities.map((activity) => (
                    <React.Fragment key={activity._id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar src={activity.user.profilePicture}>
                            {activity.type === 'chat' && <ChatIcon />}
                            {activity.type === 'task' && <TaskIcon />}
                            {activity.type === 'announcement' && <EventIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.title}
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {activity.user.username}
                              </Typography>
                              {` — ${activity.content}`}
                              <Typography variant="caption" display="block">
                                in {activity.workspace.name} - {formatDate(activity.createdAt)}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                  {recentActivities.length === 0 && !loading && (
                    <ListItem>
                      <ListItemText
                        primary="No recent activities"
                        secondary="Activities will appear here when you start collaborating."
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Upcoming Meetings
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {upcomingMeetings.map((meeting) => (
                    <React.Fragment key={meeting._id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>
                            <EventIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={meeting.title}
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                {meeting.description}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="primary">
                                  {formatDate(meeting.startTime)}
                                </Typography>
                                <AvatarGroup max={3} sx={{ mt: 1 }}>
                                  {meeting.participants.map((participant, index) => (
                                    <Avatar
                                      key={index}
                                      alt={participant.username}
                                      src={participant.profilePicture}
                                    />
                                  ))}
                                </AvatarGroup>
                              </Box>
                            </>
                          }
                        />
                        <Button variant="contained" size="small" sx={{ mt: 1 }}>
                          Join
                        </Button>
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                  {upcomingMeetings.length === 0 && !loading && (
                    <ListItem>
                      <ListItemText
                        primary="No upcoming meetings"
                        secondary="Schedule a meeting to collaborate with your team."
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Create Workspace Dialog */}
      <Dialog
        open={createWorkspaceOpen}
        onClose={handleCloseCreateWorkspace}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Workspace</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            name="name"
            label="Workspace Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newWorkspace.name}
            onChange={handleCreateWorkspaceChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="description"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newWorkspace.description}
            onChange={handleCreateWorkspaceChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateWorkspace}>Cancel</Button>
          <Button
            onClick={handleCreateWorkspace}
            variant="contained"
            disabled={!newWorkspace.name || createLoading}
          >
            {createLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default Dashboard;