// src/components/workspace/WorkspaceMembers.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Mail as MailIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client';
import { GET_WORKSPACE_MEMBERS } from '../../graphql/workspace';
import { 
  GET_WORKSPACE_INVITATIONS, 
  INVITE_USER_TO_WORKSPACE,
  CANCEL_WORKSPACE_INVITATION
} from '../../graphql/invitations';
import { useAuth } from '../../context/AuthContext';

const WorkspaceMembers = ({ workspaceId, isAdmin = false, isOwner = false }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [invitation, setInvitation] = useState({
    email: '',
    role: 'member'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get workspace members
  const { data: membersData, loading: membersLoading, refetch: refetchMembers } = useQuery(
    GET_WORKSPACE_MEMBERS, 
    { 
      variables: { workspaceId },
      fetchPolicy: 'network-only'
    }
  );

  // Get workspace invitations
  const { data: invitationsData, loading: invitationsLoading, refetch: refetchInvitations } = useQuery(
    GET_WORKSPACE_INVITATIONS, 
    { 
      variables: { workspaceId },
      fetchPolicy: 'network-only',
      skip: !isAdmin && !isOwner
    }
  );

  // Invite user mutation
  const [inviteUser, { loading: inviteLoading }] = useMutation(INVITE_USER_TO_WORKSPACE, {
    onCompleted: () => {
      setSuccess('Invitation sent successfully!');
      refetchInvitations();
      setInvitation({ email: '', role: 'member' });
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error) => {
      setError(error.message);
      setTimeout(() => setError(''), 5000);
    }
  });

  // Cancel invitation mutation
  const [cancelInvitation] = useMutation(CANCEL_WORKSPACE_INVITATION, {
    onCompleted: () => {
      refetchInvitations();
    }
  });

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle invitation dialog
  const handleOpenInviteDialog = () => {
    setInviteDialogOpen(true);
    setError('');
    setSuccess('');
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setInvitation({ email: '', role: 'member' });
  };

  // Handle invitation form
  const handleInvitationChange = (e) => {
    setInvitation({
      ...invitation,
      [e.target.name]: e.target.value
    });
  };

  // Send invitation
  const handleSendInvitation = async () => {
    if (!invitation.email) {
      setError('Email is required');
      return;
    }

    try {
      await inviteUser({
        variables: {
          input: {
            workspaceId,
            email: invitation.email,
            role: invitation.role
          }
        }
      });
    } catch (err) {
      // Error is handled in the mutation callbacks
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async (invitationId) => {
    try {
      await cancelInvitation({
        variables: { invitationId }
      });
    } catch (err) {
      console.error('Error cancelling invitation:', err);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status chip for invitation
  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip size="small" color="warning" label="Pending" />;
      case 'accepted':
        return <Chip size="small" color="success" label="Accepted" />;
      case 'rejected':
        return <Chip size="small" color="error" label="Rejected" />;
      case 'expired':
        return <Chip size="small" color="default" label="Expired" />;
      default:
        return null;
    }
  };

  // Check if user is a workspace member
  const members = membersData?.getWorkspaceMembers || [];
  const invitations = invitationsData?.getWorkspaceInvitations || [];

  return (
    <Paper>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        indicatorColor="primary"
        textColor="primary"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={`Members (${members.length})`} />
        {(isAdmin || isOwner) && <Tab label={`Invitations (${invitations.length})`} />}
      </Tabs>

      <Box sx={{ p: 2 }}>
        {activeTab === 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Workspace Members</Typography>
              {(isAdmin || isOwner) && (
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={handleOpenInviteDialog}
                >
                  Invite User
                </Button>
              )}
            </Box>

            {membersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {members.map((member) => (
                  <ListItem key={member._id} divider>
                    <ListItemAvatar>
                      <Avatar src={member.profilePicture} alt={member.username}>
                        {member.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {member.username}
                          {isOwner && member._id === user?._id && (
                            <Chip size="small" color="primary" label="Owner" sx={{ ml: 1 }} />
                          )}
                        </Box>
                      }
                      secondary={member.email}
                    />
                    {isOwner && member._id !== user?._id && (
                      <ListItemSecondaryAction>
                        <Tooltip title="Remove from workspace">
                          <IconButton edge="end" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
                {members.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    No members in this workspace yet.
                  </Typography>
                )}
              </List>
            )}
          </>
        )}

        {activeTab === 1 && (isAdmin || isOwner) && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Pending Invitations</Typography>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleOpenInviteDialog}
              >
                Invite User
              </Button>
            </Box>

            {invitationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {invitations.map((invitation) => (
                  <ListItem key={invitation._id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <MailIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {invitation.email}
                          <Box sx={{ ml: 1 }}>{getStatusChip(invitation.status)}</Box>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Role: {invitation.role === 'admin' ? 'Administrator' : 'Member'} • 
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                            Invited by: {invitation.invitedBy.username} • 
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                            Expires: {formatDate(invitation.expiresAt)}
                          </Typography>
                        </>
                      }
                    />
                    {invitation.status === 'pending' && (
                      <ListItemSecondaryAction>
                        <Tooltip title="Cancel invitation">
                          <IconButton 
                            edge="end" 
                            color="error"
                            onClick={() => handleCancelInvitation(invitation._id)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
                {invitations.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    No pending invitations.
                  </Typography>
                )}
              </List>
            )}
          </>
        )}
      </Box>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onClose={handleCloseInviteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Invite User to Workspace</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="email"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={invitation.email}
            onChange={handleInvitationChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              id="role"
              name="role"
              value={invitation.role}
              onChange={handleInvitationChange}
              label="Role"
            >
              <MenuItem value="member">Member</MenuItem>
              <MenuItem value="admin">Administrator</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            An invitation email will be sent to this address. The invitation will expire in 7 days.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInviteDialog}>Cancel</Button>
          <Button 
            onClick={handleSendInvitation} 
            variant="contained" 
            disabled={inviteLoading || !invitation.email}
            startIcon={inviteLoading ? <CircularProgress size={20} /> : <MailIcon />}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default WorkspaceMembers;