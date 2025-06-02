// src/components/dashboard/WorkspaceInvitationsView.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Button,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  AccessTime as TimeIcon,
  InfoOutlined as InfoIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

// GraphQL queries
const GET_PENDING_INVITATIONS = gql`
  query GetPendingInvitations {
    getPendingInvitations {
      _id
      email
      role
      token
      expiresAt
      createdAt
      workspace {
        _id
        name
        description
        owner {
          _id
          username
          profilePicture
        }
      }
      invitedBy {
        _id
        username
        profilePicture
      }
    }
  }
`;

const ACCEPT_INVITATION = gql`
  mutation AcceptWorkspaceInvitation($token: String!) {
    acceptWorkspaceInvitation(token: $token) {
      _id
      name
      description
    }
  }
`;

const REJECT_INVITATION = gql`
  mutation RejectWorkspaceInvitation($token: String!) {
    rejectWorkspaceInvitation(token: $token)
  }
`;

const WorkspaceInvitationsView = () => {
  const navigate = useNavigate();
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Query to get all pending invitations
  const { loading, error: queryError, data, refetch } = useQuery(GET_PENDING_INVITATIONS, {
    fetchPolicy: 'network-only',
  });

  // Mutation to accept invitation
  const [acceptInvitation, { loading: acceptLoading }] = useMutation(ACCEPT_INVITATION, {
    onCompleted: (data) => {
      setSuccess('Invitation accepted successfully!');
      setAcceptDialogOpen(false);
      refetch();
      
      // Navigate to the workspace after a short delay
      setTimeout(() => {
        navigate(`/workspace/${data.acceptWorkspaceInvitation._id}`);
      }, 1500);
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  // Mutation to reject invitation
  const [rejectInvitation, { loading: rejectLoading }] = useMutation(REJECT_INVITATION, {
    onCompleted: () => {
      setSuccess('Invitation rejected');
      setRejectDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  // Handle opening the accept dialog
  const handleAcceptClick = (invitation) => {
    setSelectedInvitation(invitation);
    setAcceptDialogOpen(true);
    setError(null);
  };

  // Handle accepting an invitation
  const handleAcceptConfirm = async () => {
    try {
      await acceptInvitation({
        variables: {
          token: selectedInvitation.token
        }
      });
    } catch (err) {
      // Error is handled in the onError callback
    }
  };

  // Handle opening the reject dialog
  const handleRejectClick = (invitation) => {
    setSelectedInvitation(invitation);
    setRejectDialogOpen(true);
    setError(null);
  };

  // Handle rejecting an invitation
  const handleRejectConfirm = async () => {
    try {
      await rejectInvitation({
        variables: {
          token: selectedInvitation.token
        }
      });
    } catch (err) {
      // Error is handled in the onError callback
    }
  };

  // Calculate time remaining for invitation expiration
  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const timeRemaining = expiration - now;
    
    if (timeRemaining < 0) {
      return 'Expired';
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    }
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    }
    
    const minutes = Math.floor(timeRemaining / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
  };

  // Format date to a readable string
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    try {
      // Try to parse the date
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      
      // Format the date
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  // Get pending invitations
  const pendingInvitations = data?.getPendingInvitations || [];

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Workspace Invitations
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : pendingInvitations.length > 0 ? (
          <Grid container spacing={2}>
            {pendingInvitations.map(invitation => (
              <Grid item xs={12} md={6} lg={4} key={invitation._id}>
                <Card elevation={3}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        src={invitation.workspace.owner?.profilePicture || ''} 
                        sx={{ mr: 2, bgcolor: 'primary.main' }}
                      >
                        {invitation.workspace.owner?.username?.charAt(0) || 'W'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                            {invitation.workspaceId.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Invited by {invitation.invitedBy.username}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {invitation.workspace.description || "No description provided"}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Role: <strong>{invitation.role === 'admin' ? 'Administrator' : 'Member'}</strong>
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {getTimeRemaining(invitation.expiresAt)}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="caption" color="text.secondary">
                      Invited on {formatDate(invitation.createdAt)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<CheckIcon />}
                      onClick={() => handleAcceptClick(invitation)}
                    >
                      Accept
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error"
                      startIcon={<CloseIcon />}
                      onClick={() => handleRejectClick(invitation)}
                    >
                      Decline
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              You don't have any pending invitations.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/explore')} 
              sx={{ mt: 2 }}
            >
              Explore Workspaces
            </Button>
          </Box>
        )}
      </Paper>
      
      {/* Accept Dialog */}
      <Dialog
        open={acceptDialogOpen}
        onClose={() => !acceptLoading && setAcceptDialogOpen(false)}
      >
        <DialogTitle>Accept Invitation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to join <strong>{selectedInvitation?.workspace?.name}</strong>?
            You will be added as a {selectedInvitation?.role === 'admin' ? 'workspace administrator' : 'regular member'}.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcceptDialogOpen(false)} disabled={acceptLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAcceptConfirm} 
            color="primary" 
            variant="contained"
            disabled={acceptLoading}
            startIcon={acceptLoading ? <CircularProgress size={20} /> : null}
          >
            {acceptLoading ? 'Accepting...' : 'Accept'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => !rejectLoading && setRejectDialogOpen(false)}
      >
        <DialogTitle>Decline Invitation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to decline the invitation to join <strong>{selectedInvitation?.workspace?.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={rejectLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleRejectConfirm} 
            color="error" 
            variant="contained"
            disabled={rejectLoading}
            startIcon={rejectLoading ? <CircularProgress size={20} /> : null}
          >
            {rejectLoading ? 'Declining...' : 'Decline'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkspaceInvitationsView;