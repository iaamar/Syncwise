// src/components/workspace/WorkspaceRequests.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Button,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useQuery, useMutation, gql } from '@apollo/client';

// GraphQL Queries and Mutations
const GET_ACCESS_REQUESTS = gql`
  query GetWorkspaceAccessRequests($workspaceId: ID!) {
    getWorkspaceAccessRequests(workspaceId: $workspaceId) {
      _id
      user {
        _id
        username
        email
        profilePicture
      }
      workspaceId
      status
      createdAt
      message
    }
  }
`;

const APPROVE_ACCESS_REQUEST = gql`
  mutation ApproveAccessRequest($requestId: ID!) {
    approveWorkspaceAccessRequest(requestId: $requestId) {
      _id
      status
    }
  }
`;

const REJECT_ACCESS_REQUEST = gql`
  mutation RejectAccessRequest($requestId: ID!) {
    rejectWorkspaceAccessRequest(requestId: $requestId) {
      _id
      status
    }
  }
`;

const WorkspaceRequests = ({ workspaceId }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  
  // Get access requests
  const { loading, error, data, refetch } = useQuery(GET_ACCESS_REQUESTS, {
    variables: { workspaceId },
    fetchPolicy: 'network-only'
  });
  
  // Approve access request mutation
  const [approveRequest, { loading: approveLoading }] = useMutation(APPROVE_ACCESS_REQUEST, {
    onCompleted: () => {
      setApproveDialogOpen(false);
      refetch();
    }
  });
  
  // Reject access request mutation
  const [rejectRequest, { loading: rejectLoading }] = useMutation(REJECT_ACCESS_REQUEST, {
    onCompleted: () => {
      setRejectDialogOpen(false);
      refetch();
    }
  });
  
  // Handle approve
  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };
  
  const handleApproveConfirm = async () => {
    if (!selectedRequest) return;
    
    try {
      await approveRequest({
        variables: { requestId: selectedRequest._id }
      });
    } catch (err) {
      console.error('Error approving request:', err);
    }
  };
  
  // Handle reject
  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };
  
  const handleRejectConfirm = async () => {
    if (!selectedRequest) return;
    
    try {
      await rejectRequest({
        variables: { requestId: selectedRequest._id }
      });
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get status chip
  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip size="small" color="warning" label="Pending" icon={<AccessTimeIcon />} />;
      case 'approved':
        return <Chip size="small" color="success" label="Approved" icon={<CheckCircleIcon />} />;
      case 'rejected':
        return <Chip size="small" color="error" label="Rejected" icon={<CancelIcon />} />;
      default:
        return null;
    }
  };
  
  // Get pending requests
  const pendingRequests = data?.getWorkspaceAccessRequests?.filter(r => r.status === 'pending') || [];
  const processedRequests = data?.getWorkspaceAccessRequests?.filter(r => r.status !== 'pending') || [];
  
  // Main render
  return (
    <Paper>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Access Requests
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            Error loading requests: {error.message}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {pendingRequests.length === 0 && processedRequests.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <InfoIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Typography variant="body1" color="text.secondary">
                  No access requests found for this workspace.
                </Typography>
              </Box>
            ) : (
              <>
                {pendingRequests.length > 0 && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Pending Requests
                    </Typography>
                    <List>
                      {pendingRequests.map((request) => (
                        <ListItem key={request._id} divider>
                          <ListItemAvatar>
                            <Avatar src={request.user.profilePicture} alt={request.user.username}>
                              {request.user.username.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {request.user.username}
                                <Box sx={{ ml: 1 }}>{getStatusChip(request.status)}</Box>
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  {request.user.email} • 
                                </Typography>
                                <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                  Requested: {formatDate(request.createdAt)}
                                </Typography>
                                {request.message && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    "{request.message}"
                                  </Typography>
                                )}
                              </>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title="Approve">
                              <IconButton 
                                edge="end" 
                                color="success"
                                onClick={() => handleApproveClick(request)}
                                sx={{ mr: 1 }}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton 
                                edge="end" 
                                color="error"
                                onClick={() => handleRejectClick(request)}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
                
                {processedRequests.length > 0 && (
                  <>
                    <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                      Recent Activity
                    </Typography>
                    <List>
                      {processedRequests.slice(0, 5).map((request) => (
                        <ListItem key={request._id} divider>
                          <ListItemAvatar>
                            <Avatar src={request.user.profilePicture} alt={request.user.username}>
                              {request.user.username.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {request.user.username}
                                <Box sx={{ ml: 1 }}>{getStatusChip(request.status)}</Box>
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {request.status === 'approved' ? 'Approved' : 'Rejected'} on {formatDate(request.updatedAt || request.createdAt)}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </>
            )}
          </>
        )}
      </Box>
      
      {/* Approve Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => !approveLoading && setApproveDialogOpen(false)}
      >
        <DialogTitle>Approve Access Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to approve access for <strong>{selectedRequest?.user?.username}</strong> to join this workspace?
            They will be added as a member.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setApproveDialogOpen(false)} 
            disabled={approveLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApproveConfirm} 
            color="success" 
            variant="contained"
            disabled={approveLoading}
            startIcon={approveLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => !rejectLoading && setRejectDialogOpen(false)}
      >
        <DialogTitle>Reject Access Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reject the access request from <strong>{selectedRequest?.user?.username}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRejectDialogOpen(false)} 
            disabled={rejectLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRejectConfirm} 
            color="error" 
            variant="contained"
            disabled={rejectLoading}
            startIcon={rejectLoading ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default WorkspaceRequests;