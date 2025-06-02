// src/layouts/MainLayout.js
import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, useMediaQuery, useTheme, Badge, Tooltip } from '@mui/material';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import { WorkspaceProvider } from '../context/WorkspaceContext';
import { useQuery, gql } from '@apollo/client';

// GraphQL query to get notification count
const GET_NOTIFICATION_COUNT = gql`
  query GetNotificationCount {
    getPendingInvitations {
      _id
    }
    getPendingWorkspaceRequests {
      _id
    }
  }
`;

const MainLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [notificationCount, setNotificationCount] = useState(0);

  // Get notification data
  const { data, refetch } = useQuery(GET_NOTIFICATION_COUNT, {
    fetchPolicy: 'network-only',
    pollInterval: 60000 // Poll every minute
  });

  // Update drawer state when screen size changes
  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  // Update notification count
  useEffect(() => {
    if (data) {
      const invitationCount = data.getPendingInvitations?.length || 0;
      const requestCount = data.getPendingWorkspaceRequests?.length || 0;
      setNotificationCount(invitationCount + requestCount);
    }
  }, [data]);

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <WorkspaceProvider>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <CssBaseline />
        
        {/* Header with App Bar */}
        <Header 
          onDrawerToggle={handleDrawerToggle} 
          notificationCount={notificationCount}
        />
        
        {/* Sidebar */}
        <Sidebar
          open={drawerOpen}
          onClose={handleDrawerToggle}
          variant={isMobile ? 'temporary' : 'permanent'}
        />
        
        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - 240px)` },
            mt: '64px',
            height: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </WorkspaceProvider>
  );
};

export default MainLayout;