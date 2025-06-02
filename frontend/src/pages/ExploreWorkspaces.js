// src/pages/ExploreWorkspaces.js
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import { useState } from 'react';
import { 
  Search as SearchIcon,
  Bookmarks as BookmarksIcon,
  History as HistoryIcon 
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import WorkspaceDirectory from '../components/workspace/WorkspaceDirectory';

const ExploreWorkspaces = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Explore Workspaces
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover and join workspaces to collaborate with teams.
          </Typography>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<SearchIcon />} label="Discover" />
            <Tab icon={<BookmarksIcon />} label="Bookmarked" />
            <Tab icon={<HistoryIcon />} label="Recently Viewed" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <WorkspaceDirectory />
        )}

        {activeTab === 1 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <BookmarksIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Bookmarked Workspaces
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bookmark workspaces you're interested in to find them quickly later.
            </Typography>
          </Paper>
        )}

        {activeTab === 2 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <HistoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Recently Viewed Workspaces
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Workspaces you've viewed recently will appear here.
            </Typography>
          </Paper>
        )}
      </Box>
    </MainLayout>
  );
};

export default ExploreWorkspaces;