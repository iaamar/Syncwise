// src/components/dashboard/PendingInvitations.js
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
  Chip,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  WorkOutline as WorkspaceIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client';
import { 
  GET_PENDING_INVITATIONS, 
  ACCEPT_WORKSPACE_INVITATION, 
  REJECT_WORKSPACE_INVITATION 
} from '../../graphql/invitations';
import { useNavigate } from 'react-router-dom';

const PendingInvitations = () => {
  const navigate = useNavigate();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [error, setError] = useState('');

  // Get pending invitations
  const { data, loading, refetch } = useQuery(GET_PENDING_INVITATIONS, {
    fetchPolicy: 'network-only'
  });

  // Accept invitation mutation
  const [acceptInvitation, { loading: acceptLoading }] = useMutation(ACCEPT_WORKSPACE_INVITATION, {
    onCompleted: (data) => {
      refetch();
      setConfirmDialogOpen(false);
      // Navigate to the workspace
      navigate(`/workspace/${data.acceptWorkspaceInvitation._id}`);
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  // Reject invitation mutation
  const [rejectInvitation, { loading: rejectLoading }] = useMutation(REJECT_WORKSPACE_INVITATION, {
    onCompleted: () => {
      refetch();
      setRejectDialogOpen(false);
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  // Handle accept invitation
  const handleAcceptConfirm = (invitation) => {
    setSelectedInvitation(invitation);
    setConfirmDialogOpen(true);
  };

  const handleAcceptInvitation = async () => {
    if (!selectedInvitation) return;

    try {
      await acceptInvitation({
        variables: { token: selectedInvitation.token }
      });
    } catch (err) {
      // Error handled in the mutation onError callback
    }
  };

  // Handle reject invitation
  const handleRejectConfirm = (invitation) => {
    setSelectedInvitation(invitation);
    setRejectDialogOpen(true);
  };

  const handleRejectInvitation = async () => {
    if (!selectedInvitation) return;

    try {
      await rejectInvitation({
        variables: { token: selectedInvitation.token }
      });
    } catch (err) {
      // Error handled in the mutation onError callback
    }
  };

  // Format date
  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      return `${diffDays} days left`;
    } else if (diffDays === 1) {
      return '1 day left';
    } else {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return `${diffHours} hours left`;
    }
  };

  const pendingInvitations = data?.getPendingInvitations || [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (pendingInvitations.length === 0) {
    return null; // Don't show the component if there are no invitations
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Pending Workspace Invitations
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        You have {pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 ? 's' : ''} to join workspaces.
      </Typography>

      <Grid container spacing={2}>
        {pendingInvitations.map((invitation) => (
          <Grid item xs={12} sm={6} md={4} key={invitation._id}>
            <Card 
              variant="outlined"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                    src={invitation.workspace?.owner?.profilePicture} 
                    alt={invitation.workspace?.owner?.username}
                    sx={{ mr: 1 }}
                  >
                    {invitation.workspace?.owner?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {invitation.workspace?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Invited by {invitation.invitedBy?.username}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {invitation.workspace?.description || "No description provided."}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Role: {invitation.role === 'admin' ? 'Administrator' : 'Member'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatTimeRemaining(invitation.expiresAt)}
                  </Typography>
                </Box>
              </CardContent>

              <Divider />

              <CardActions>
                <Tooltip title="Accept invitation">
                  <Button 
                    size="small" 
                    color="primary" 
                    startIcon={<CheckIcon />}
                    onClick={() => handleAcceptConfirm(invitation)}
                  >
                    Accept
                  </Button>
                </Tooltip>
                <Tooltip title="Decline invitation">
                  <Button 
                    size="small" 
                    color="error" 
                    startIcon={<CloseIcon />}
                    onClick={() => handleRejectConfirm(invitation)}
                  >
                    Decline
                  </Button>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Accept Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="accept-dialog-title"
      >
        <DialogTitle id="accept-dialog-title">
          Accept Workspace Invitation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to join <strong>{selectedInvitation?.workspace?.name}</strong>? 
            You'll be added as a {selectedInvitation?.role === 'admin' ? 'an administrator' : 'a member'}.
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAcceptInvitation} 
            color="primary" 
            disabled={acceptLoading} 
            variant="contained"
            startIcon={acceptLoading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            Accept
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        aria-labelledby="reject-dialog-title"
      >
        <DialogTitle id="reject-dialog-title">
          Decline Workspace Invitation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to decline the invitation to join <strong>{selectedInvitation?.workspace?.name}</strong>?
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRejectInvitation} 
            color="error" 
            disabled={rejectLoading} 
            variant="contained"
            startIcon={rejectLoading ? <CircularProgress size={20} /> : <CloseIcon />}
          >
            Decline
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingInvitations;