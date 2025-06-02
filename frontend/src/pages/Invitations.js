// src/pages/Invitations.js
import React from 'react';
import {
  Box,
  Typography,
  Divider,
  Breadcrumbs,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import WorkspaceInvitationsView from '../components/dashboard/WorkspaceInvitationsView';

const Invitations = () => {
  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link
              underline="hover"
              color="inherit"
              component={RouterLink}
              to="/dashboard"
            >
              Dashboard
            </Link>
            <Typography color="text.primary">Invitations</Typography>
          </Breadcrumbs>
          
          <Typography variant="h4" sx={{ mt: 2 }}>
            Manage Invitations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and respond to workspace invitations
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <WorkspaceInvitationsView />
      </Box>
    </MainLayout>
  );
};

export default Invitations;