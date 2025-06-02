// src/pages/Meetings.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Avatar, 
  AvatarGroup, 
  Chip, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  Add as AddIcon,
  Event as EventIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useMutation, useQuery, gql } from '@apollo/client';
import MainLayout from '../layouts/MainLayout';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';

// GraphQL queries and mutations
const GET_WORKSPACE_MEETINGS = gql`
  query GetWorkspaceMeetings($workspaceId: ID!) {
    getWorkspaceMeetings(workspaceId: $workspaceId) {
      _id
      title
      description
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

const CREATE_MEETING = gql`
  mutation CreateMeeting($input: MeetingInput!) {
    createMeeting(input: $input) {
      _id
      title
      status
    }
  }
`;

const Meetings = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
  });

  // Query to get workspace meetings
  const { data, loading, error, refetch } = useQuery(GET_WORKSPACE_MEETINGS, {
    variables: { workspaceId },
    fetchPolicy: 'network-only',
  });

  // Create meeting mutation
  const [createMeeting, { loading: createLoading }] = useMutation(CREATE_MEETING, {
    onCompleted: (data) => {
      if (data?.createMeeting?._id) {
        setMeetingDialogOpen(false);
        refetch();
        // Automatically join the meeting
        navigate(`/video/${data.createMeeting._id}`);
      }
    },
    onError: (err) => {
      console.error('Error creating meeting:', err);
    }
  });

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Not scheduled';
      }
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Not scheduled';
    }
  };

  // Handle meeting creation
  const handleOpenMeetingDialog = () => {
    setMeetingDialogOpen(true);
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
      console.error('Error creating meeting:', err);
    }
  };

  // Join meeting handler
  const handleJoinMeeting = (meetingId) => {
    navigate(`/video/${meetingId}`);
  };

  const meetings = data?.getWorkspaceMeetings || [];
  const activeMeetings = meetings.filter(m => m.status === 'in-progress' || m.status === 'scheduled');
  const pastMeetings = meetings.filter(m => m.status === 'completed');

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Meetings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Schedule, join, or review your meetings in {activeWorkspace?.name || 'this workspace'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenMeetingDialog}
          >
            Create Meeting
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Active and Upcoming Meetings */}
            <Typography variant="h5" gutterBottom>
              Active & Upcoming Meetings
            </Typography>
            <Grid container spacing={3} sx={{ mb: 5 }}>
              {activeMeetings.length > 0 ? (
                activeMeetings.map((meeting) => (
                  <Grid item xs={12} md={6} lg={4} key={meeting._id}>
                    <Card 
                      variant="outlined"
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                          boxShadow: 3
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6">{meeting.title}</Typography>
                          {meeting.status === 'in-progress' && (
                            <Chip 
                              label="Active" 
                              color="success" 
                              size="small"
                              sx={{ fontWeight: 'medium' }}
                            />
                          )}
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {meeting.description || 'No description provided'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EventIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {formatDate(meeting.startTime)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AvatarGroup max={3}>
                              {meeting.participants.map((participant, idx) => (
                                <Avatar 
                                  key={idx} 
                                  src={participant.profilePicture} 
                                  alt={participant.username}
                                  sx={{ width: 24, height: 24 }}
                                >
                                  {participant.username.charAt(0).toUpperCase()}
                                </Avatar>
                              ))}
                            </AvatarGroup>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              {meeting.participants.length} participants
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          fullWidth 
                          variant="contained" 
                          startIcon={<VideoCallIcon />}
                          onClick={() => handleJoinMeeting(meeting._id)}
                          color={meeting.status === 'in-progress' ? 'success' : 'primary'}
                        >
                          {meeting.status === 'in-progress' ? 'Join Now' : 'Join Meeting'}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <EventIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No upcoming meetings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Schedule a meeting to collaborate with your team in real-time
                    </Typography>
                    <Button 
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenMeetingDialog}
                    >
                      Create Meeting
                    </Button>
                  </Paper>
                </Grid>
              )}
            </Grid>

            {/* Past Meetings */}
            {pastMeetings.length > 0 && (
              <>
                <Typography variant="h5" gutterBottom>
                  Past Meetings
                </Typography>
                <Grid container spacing={3}>
                  {pastMeetings.map((meeting) => (
                    <Grid item xs={12} md={6} lg={4} key={meeting._id}>
                      <Card 
                        variant="outlined"
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          opacity: 0.8
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6">{meeting.title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
                            {meeting.description || 'No description provided'}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <EventIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              Held on {formatDate(meeting.startTime)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              {meeting.participants.length} participants
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button 
                            fullWidth 
                            variant="outlined" 
                            disabled
                          >
                            Meeting Ended
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </>
        )}
      </Box>

      {/* Create Meeting Dialog */}
      <Dialog
        open={meetingDialogOpen}
        onClose={handleCloseMeetingDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start New Meeting</DialogTitle>
        <DialogContent>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMeetingDialog}>Cancel</Button>
          <Button
            onClick={handleCreateMeeting}
            variant="contained"
            disabled={!newMeeting.title || createLoading}
            startIcon={createLoading ? <CircularProgress size={20} /> : null}
          >
            {createLoading ? 'Creating...' : 'Start Meeting'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default Meetings;