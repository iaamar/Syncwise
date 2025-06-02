// src/components/workspace/WorkspaceDirectory.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  PersonAdd as PersonAddIcon,
  Info as InfoIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

// GraphQL Queries and Mutations
const SEARCH_PUBLIC_WORKSPACES = gql`
  query SearchPublicWorkspaces($query: String!) {
    searchPublicWorkspaces(query: $query) {
      _id
      name
      description
      memberCount
      owner {
        _id
        username
        profilePicture
      }
      createdAt
      isPublic
    }
  }
`;

const REQUEST_WORKSPACE_ACCESS = gql`
  mutation RequestWorkspaceAccess($workspaceId: ID!) {
    requestWorkspaceAccess(workspaceId: $workspaceId) {
      _id
      status
    }
  }
`;

const WorkspaceDirectory = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [error, setError] = useState(''); // Added missing error state

  // Search workspaces query
  const { loading, error: queryError, data, refetch } = useQuery(SEARCH_PUBLIC_WORKSPACES, {
    variables: { query: searchQuery || '' },
    fetchPolicy: 'network-only',
    skip: searchQuery === '', // Skip initial query when searchQuery is empty
    onError: (err) => {
      setError(err.message);
    }
  });

  // Request workspace access mutation
  const [requestAccess, { loading: requestLoading }] = useMutation(REQUEST_WORKSPACE_ACCESS, {
    onCompleted: () => {
      setRequestSuccess(true);
      // Reset after 3 seconds
      setTimeout(() => {
        setShowRequestDialog(false);
        setRequestSuccess(false);
      }, 3000);
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // Handle request access
  const handleRequestAccess = (workspace) => {
    setSelectedWorkspace(workspace);
    setShowRequestDialog(true);
    setError(''); // Clear any previous errors
  };

  // Submit request
  const submitRequest = async () => {
    if (!selectedWorkspace) return;

    try {
      await requestAccess({
        variables: { 
          workspaceId: selectedWorkspace._id,
          message: "" // Add an optional message parameter
        }
      });
    } catch (err) {
      // Error handled in mutation onError callback
      console.error('Error requesting access:', err);
    }
  };

  // Sort workspaces
  const sortWorkspaces = (workspaces) => {
    if (!workspaces) return [];

    switch (sortBy) {
      case 'newest':
        return [...workspaces].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return [...workspaces].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'name_asc':
        return [...workspaces].sort((a, b) => a.name.localeCompare(b.name));
      case 'name_desc':
        return [...workspaces].sort((a, b) => b.name.localeCompare(a.name));
      case 'members':
        return [...workspaces].sort((a, b) => b.memberCount - a.memberCount);
      default:
        return workspaces;
    }
  };

  // Filter workspaces by category
  const filterWorkspaces = (workspaces) => {
    if (!workspaces) return [];
    if (selectedCategory === 'all') return workspaces;
    
    // This is a placeholder - we would need to add categories to workspaces in the backend
    return workspaces.filter(workspace => 
      workspace.category === selectedCategory || selectedCategory === 'all'
    );
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get workspaces to display
  const workspacesToDisplay = sortWorkspaces(filterWorkspaces(data?.searchPublicWorkspaces || []));
  
  // Placeholder categories
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'engineering', name: 'Engineering' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'design', name: 'Design' },
    { id: 'product', name: 'Product Management' },
    { id: 'support', name: 'Customer Support' },
    { id: 'hr', name: 'HR & Operations' },
    { id: 'education', name: 'Education' },
    { id: 'other', name: 'Other' }
  ];

  return (
    <Box>
      {/* Search Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Typography variant="h5" gutterBottom>
            Find Workspaces to Join
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Search for public workspaces by name, description, or category.
          </Typography>
          
          {/* Display errors */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          {queryError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error searching workspaces: {queryError.message}
            </Alert>
          )}
          
          <Box 
            component="form" 
            onSubmit={handleSearch}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 3
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: loading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={24} />
                  </InputAdornment>
                ) : null
              }}
            />
            <Button 
              type="submit"
              variant="contained"
              sx={{ ml: 1, height: 56 }}
            >
              Search
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  label="Category"
                >
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="sort-label">Sort By</InputLabel>
                <Select
                  labelId="sort-label"
                  value={sortBy}
                  onChange={handleSortChange}
                  label="Sort By"
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="name_asc">Name (A-Z)</MenuItem>
                  <MenuItem value="name_desc">Name (Z-A)</MenuItem>
                  <MenuItem value="members">Most Members</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Search Results */}
      {searchQuery && data?.searchPublicWorkspaces?.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No workspaces found matching "{searchQuery}". Try a different search term.
        </Alert>
      )}

      <Grid container spacing={3}>
        {workspacesToDisplay.map(workspace => (
          <Grid item xs={12} sm={6} md={4} key={workspace._id}>
            <Card 
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6">
                    {workspace.name}
                  </Typography>
                  <Tooltip title={workspace.isPublic ? "Public workspace" : "Private workspace (requires approval)"}>
                    <Box>
                      {workspace.isPublic ? (
                        <PublicIcon fontSize="small" color="primary" />
                      ) : (
                        <LockIcon fontSize="small" color="action" />
                      )}
                    </Box>
                  </Tooltip>
                </Box>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    minHeight: '60px'
                  }}
                >
                  {workspace.description || "No description provided."}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar 
                    src={workspace.owner?.profilePicture} 
                    alt={workspace.owner?.username}
                    sx={{ width: 24, height: 24, mr: 1 }}
                  >
                    {workspace.owner?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    Created by {workspace.owner?.username} • {formatDate(workspace.createdAt)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip 
                    icon={<InfoIcon />} 
                    label={`${workspace.memberCount} ${workspace.memberCount === 1 ? 'member' : 'members'}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
              
              <Divider />
              
              <CardActions>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  size="small"
                  fullWidth
                  onClick={() => handleRequestAccess(workspace)}
                >
                  Request to Join
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        
        {/* Placeholder for empty state or initial state */}
        {!searchQuery && !data && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Search for workspaces to join
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter keywords in the search bar above to find workspaces that match your interests.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Request Access Dialog */}
      <Dialog
        open={showRequestDialog}
        onClose={() => {
          if (!requestLoading && !requestSuccess) {
            setShowRequestDialog(false);
          }
        }}
      >
        <DialogTitle>
          Request to Join Workspace
        </DialogTitle>
        <DialogContent>
          {requestSuccess ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Request Sent Successfully!
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                The workspace admin will review your request.
                You'll receive a notification when your request is approved.
              </Typography>
            </Box>
          ) : (
            <>
              <DialogContentText>
                You're requesting to join <strong>{selectedWorkspace?.name}</strong>. 
                The workspace administrator will need to approve your request before you can access it.
              </DialogContentText>
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        {!requestSuccess && (
          <DialogActions>
            <Button onClick={() => setShowRequestDialog(false)} disabled={requestLoading}>
              Cancel
            </Button>
            <Button 
              onClick={submitRequest} 
              variant="contained" 
              disabled={requestLoading}
              startIcon={requestLoading ? <CircularProgress size={20} /> : <PersonAddIcon />}
            >
              Send Request
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default WorkspaceDirectory;