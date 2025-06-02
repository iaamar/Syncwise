// src/pages/Workspace.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Divider, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Chat as ChatIcon, 
  Task as TaskIcon, 
  VideoCall as VideoCallIcon,
  Group as GroupIcon,
  Event as EventIcon
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import WorkspaceMembers from '../components/workspace/WorkspaceMembers';

// GraphQL Queries and Mutations
const GET_WORKSPACE_DATA = gql`
  query GetWorkspaceData($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      _id
      name
      description
      owner {
        _id
        username
      }
      members {
        userId
        role
      }
    }
    getWorkspaceChannels(workspaceId: $workspaceId) {
      _id
      name
      description
      type
    }
  }
`;

const CREATE_CHANNEL = gql`
  mutation CreateChannel($input: ChannelInput!) {
    createChannel(input: $input) {
      _id
      name
      description
      type
    }
  }
`;

const CREATE_MEETING = gql`
  mutation CreateMeeting($input: MeetingInput!) {
    createMeeting(input: $input) {
      _id
      title
      status
    }
  }
`;

const Workspace = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setActiveWorkspace, fetchMeetings } = useWorkspace();
  const [activeTab, setActiveTab] = useState(0);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: '',
    description: '',
    type: 'public',
  });
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
  });
  const [error, setError] = useState(null);

  // Get workspace data
  const { loading, error: queryError, data, refetch } = useQuery(GET_WORKSPACE_DATA, {
    variables: { workspaceId },
    fetchPolicy: 'network-only',
    onError: (err) => {
      console.error('Error fetching workspace:', err);
      setError(err.message);
    }
  });

  // Create channel mutation
  const [createChannel, { loading: channelLoading }] = useMutation(CREATE_CHANNEL, {
    onCompleted: () => {
      handleCloseChannelDialog();
      refetch();
    },
    onError: (err) => {
      console.error('Error creating channel:', err);
      setError(err.message);
    }
  });

  // Create meeting mutation
  const [createMeeting, { loading: meetingLoading }] = useMutation(CREATE_MEETING, {
    onCompleted: (data) => {
      handleCloseMeetingDialog();
      if (data?.createMeeting?._id) {
        navigate(`/video/${data.createMeeting._id}`);
      }
    },
    onError: (err) => {
      console.error('Error creating meeting:', err);
      setError(err.message);
    }
  });

  // Set active workspace when data changes
  useEffect(() => {
    if (data?.getWorkspace) {
      setActiveWorkspace(data.getWorkspace);
    }
  }, [data, setActiveWorkspace]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle channel dialog
  const handleOpenChannelDialog = () => {
    setChannelDialogOpen(true);
    setError(null);
  };

  const handleCloseChannelDialog = () => {
    setChannelDialogOpen(false);
    setNewChannel({
      name: '',
      description: '',
      type: 'public',
    });
  };

  const handleChannelChange = (e) => {
    setNewChannel({
      ...newChannel,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateChannel = async () => {
    if (!newChannel.name) return;

    try {
      await createChannel({
        variables: {
          input: {
            ...newChannel,
            workspaceId,
          },
        },
      });
    } catch (err) {
      // Error handled in mutation onError
    }
  };

  // Handle meeting dialog
  const handleOpenMeetingDialog = () => {
    setMeetingDialogOpen(true);
    setError(null);
  };

  const handleCloseMeetingDialog = () => {
    setMeetingDialogOpen(false);
    setNewMeeting({
      title: '',
      description: '',
    });
  };

  const handleMeetingChange = (e) => {
    setNewMeeting({
      ...newMeeting,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateMeeting = async () => {
    if (!newMeeting.title) return;

    try {
      await createMeeting({
        variables: {
          input: {
            ...newMeeting,
            workspaceId,
            participants: [], // Will be populated with workspace members on the server
            startTime: new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      // Error handled in mutation onError
    }
  };

  // Handle channel click
  const handleChannelClick = (channelId) => {
    navigate(`/workspace/${workspaceId}/chat/${channelId}`);
  };

  // Handle task board click
  const handleTaskBoardClick = () => {
    navigate(`/workspace/${workspaceId}/tasks`);
  };
  
  // Handle meetings click
  const handleMeetingsClick = () => {
    navigate(`/workspace/${workspaceId}/meetings`);
  };

  // If workspace doesn't exist or error occurred, navigate to dashboard
  useEffect(() => {
    if (queryError) {
      navigate('/dashboard');
    }
  }, [queryError, navigate]);

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
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </Box>
      </MainLayout>
    );
  }

  const workspace = data?.getWorkspace;
  const channels = data?.getWorkspaceChannels || [];
  
  // Check user permissions
  const isOwner = workspace?.owner?._id === user?._id;
  const isAdmin = workspace?.members?.some(
    (member) => member.userId === user?._id && member.role === 'admin'
  );

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {workspace?.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {workspace?.description}
          </Typography>
        </Box>

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<ChatIcon />} label="Channels" />
          <Tab icon={<TaskIcon />} label="Tools" />
          <Tab icon={<GroupIcon />} label="Members" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Channels</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    size="small"
                    onClick={handleOpenChannelDialog}
                  >
                    New Channel
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {channels.map((channel) => (
                    <ListItem
                      button
                      key={channel._id}
                      onClick={() => handleChannelClick(channel._id)}
                    >
                      <ListItemIcon>
                        <ChatIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={`#${channel.name}`}
                        secondary={channel.description}
                      />
                    </ListItem>
                  ))}
                  {channels.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="No channels yet"
                        secondary="Create a new channel to start collaborating"
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Workspace Tools
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      onClick={handleTaskBoardClick}
                    >
                      <IconButton
                        sx={{
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText',
                          mb: 1,
                        }}
                      >
                        <TaskIcon />
                      </IconButton>
                      <Typography variant="subtitle1">Task Board</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manage your team's tasks
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      onClick={handleMeetingsClick}
                    >
                      <IconButton
                        sx={{
                          backgroundColor: 'secondary.light',
                          color: 'secondary.contrastText',
                          mb: 1,
                        }}
                      >
                        <EventIcon />
                      </IconButton>
                      <Typography variant="subtitle1">Video Meetings</Typography>
                      <Typography variant="body2" color="text.secondary">
                        View or start team meetings
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      onClick={handleOpenMeetingDialog}
                    >
                      <IconButton
                        sx={{
                          backgroundColor: 'secondary.light',
                          color: 'secondary.contrastText',
                          mb: 1,
                        }}
                      >
                        <VideoCallIcon />
                      </IconButton>
                      <Typography variant="subtitle1">Quick Video Call</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Start an instant team meeting
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <WorkspaceMembers 
            workspaceId={workspaceId}
            isOwner={isOwner}
            isAdmin={isAdmin}
          />
        )}
      </Box>

      {/* Create Channel Dialog */}
      <Dialog
        open={channelDialogOpen}
        onClose={handleCloseChannelDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Channel</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            name="name"
            label="Channel Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newChannel.name}
            onChange={handleChannelChange}
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
            value={newChannel.description}
            onChange={handleChannelChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseChannelDialog}>Cancel</Button>
          <Button
            onClick={handleCreateChannel}
            variant="contained"
            disabled={!newChannel.name || channelLoading}
            startIcon={channelLoading ? <CircularProgress size={20} /> : null}
          >
            {channelLoading ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Meeting Dialog */}
      <Dialog
        open={meetingDialogOpen}
        onClose={handleCloseMeetingDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start New Meeting</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="title"
            name="title"
            label="Meeting Title"
            type="text"
            fullWidth
            variant="outlined"
            value={newMeeting.title}
            onChange={handleMeetingChange}
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
            value={newMeeting.description}
            onChange={handleMeetingChange}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Starting a meeting will immediately create a video call that you can invite team members to join.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMeetingDialog}>Cancel</Button>
          <Button
            onClick={handleCreateMeeting}
            variant="contained"
            disabled={!newMeeting.title || meetingLoading}
            startIcon={meetingLoading ? <CircularProgress size={20} /> : null}
          >
            {meetingLoading ? "Starting..." : "Start Meeting"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default Workspace;