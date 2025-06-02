import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  TextField, 
  Dialog,
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress,
  Avatar,
  Chip,
  IconButton,
  Menu,
} from '@mui/material';
import { 
  Add as AddIcon, 
  MoreVert as MoreVertIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';

// GraphQL Queries and Mutations
const GET_WORKSPACE_TASKS = gql`
  query GetWorkspaceTasks($workspaceId: ID!) {
    getWorkspaceTasks(workspaceId: $workspaceId) {
      _id
      title
      description
      status
      priority
      assignees {
        _id
        username
        profilePicture
      }
      dueDate
      createdBy {
        _id
        username
      }
    }
    getWorkspaceMembers(workspaceId: $workspaceId) {
      _id
      username
      profilePicture
    }
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask($input: TaskInput!) {
    createTask(input: $input) {
      _id
      title
      description
      status
      priority
      assignees {
        _id
        username
        profilePicture
      }
      dueDate
    }
  }
`;

const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: TaskInput!) {
    updateTask(id: $id, input: $input) {
      _id
      title
      description
      status
      priority
      assignees {
        _id
        username
        profilePicture
      }
      dueDate
    }
  }
`;

const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

const TaskBoard = () => {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'backlog',
    priority: 'medium',
    assignees: [],
    dueDate: '',
  });

  // Get workspace tasks
  const { loading, error, data, refetch } = useQuery(GET_WORKSPACE_TASKS, {
    variables: { workspaceId },
    fetchPolicy: 'network-only',
  });

  // Create task mutation
  const [createTask] = useMutation(CREATE_TASK, {
    onCompleted: () => {
      refetch();
      handleCloseTaskDialog();
    },
  });

  // Update task mutation
  const [updateTask] = useMutation(UPDATE_TASK, {
    onCompleted: () => {
      refetch();
      handleCloseTaskDialog();
    },
  });

  // Delete task mutation
  const [deleteTask] = useMutation(DELETE_TASK, {
    onCompleted: () => {
      refetch();
      handleCloseTaskDialog();
    },
  });

  // Handle task dialog
  const handleOpenTaskDialog = (task = null) => {
    if (task) {
      setSelectedTask(task);
      setTaskForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assignees: task.assignees.map(a => a._id),
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      });
    } else {
      setSelectedTask(null);
      setTaskForm({
        title: '',
        description: '',
        status: 'backlog',
        priority: 'medium',
        assignees: [],
        dueDate: '',
      });
    }
    setTaskDialogOpen(true);
  };

  const handleCloseTaskDialog = () => {
    setTaskDialogOpen(false);
    setSelectedTask(null);
  };

  // Handle menu
  const handleOpenMenu = (event, task) => {
    event.stopPropagation();
    setSelectedTask(task);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  // Handle form change
  const handleFormChange = (e) => {
    setTaskForm({
      ...taskForm,
      [e.target.name]: e.target.value,
    });
  };

  // Handle multiple select change
  const handleMultipleSelectChange = (e) => {
    setTaskForm({
      ...taskForm,
      assignees: e.target.value,
    });
  };

  // Handle save task
  const handleSaveTask = async () => {
    const taskInput = {
      title: taskForm.title,
      description: taskForm.description,
      workspaceId,
      status: taskForm.status,
      priority: taskForm.priority,
      assignees: taskForm.assignees,
      dueDate: taskForm.dueDate || null,
    };

    try {
      if (selectedTask) {
        // Update task
        await updateTask({
          variables: {
            id: selectedTask._id,
            input: taskInput,
          },
        });
      } else {
        // Create task
        await createTask({
          variables: {
            input: taskInput,
          },
        });
      }
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  // Handle delete task
  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    try {
      await deleteTask({
        variables: {
          id: selectedTask._id,
        },
      });
      handleCloseMenu();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Handle move task
  const handleMoveTask = async (task, newStatus) => {
    try {
      await updateTask({
        variables: {
          id: task._id,
          input: {
            title: task.title,
            description: task.description,
            workspaceId,
            status: newStatus,
            priority: task.priority,
            assignees: task.assignees.map(a => a._id),
            dueDate: task.dueDate,
          },
        },
      });
    } catch (err) {
      console.error('Error moving task:', err);
    }
  };

  // Get tasks by status
  const getTasksByStatus = (status) => {
    if (!data?.getWorkspaceTasks) return [];
    return data.getWorkspaceTasks.filter(task => task.status === status);
  };

  // Get next status
  const getNextStatus = (currentStatus) => {
    const statuses = ['backlog', 'in-progress', 'review', 'done'];
    const currentIndex = statuses.indexOf(currentStatus);
    return currentIndex < statuses.length - 1 ? statuses[currentIndex + 1] : null;
  };

  // Get previous status
  const getPreviousStatus = (currentStatus) => {
    const statuses = ['backlog', 'in-progress', 'review', 'done'];
    const currentIndex = statuses.indexOf(currentStatus);
    return currentIndex > 0 ? statuses[currentIndex - 1] : null;
  };

  // Priority colors
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'warning';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Check if date is past due
  const isPastDue = (dateString) => {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    return dueDate < today;
  };

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
          <Typography color="error">
            Error loading tasks: {error.message}
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  const columnStatuses = [
    { id: 'backlog', title: 'Backlog' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' },
  ];

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Task Board</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenTaskDialog()}
          >
            Add Task
          </Button>
        </Box>

        <Grid container spacing={2}>
          {columnStatuses.map(column => (
            <Grid item xs={12} sm={6} md={3} key={column.id}>
              <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{column.title}</Typography>
                  <Chip 
                    label={getTasksByStatus(column.id).length} 
                    size="small" 
                    color="primary" 
                  />
                </Box>
                
                <Box
                  sx={{
                    flexGrow: 1,
                    minHeight: '200px',
                    bgcolor: 'background.default',
                    p: 1,
                    borderRadius: 1,
                    overflow: 'auto',
                  }}
                >
                  {getTasksByStatus(column.id).map((task) => (
                    <Paper
                      key={task._id}
                      elevation={1}
                      sx={{
                        p: 2,
                        mb: 2,
                        '&:hover': {
                          boxShadow: 3,
                        },
                      }}
                      onClick={() => handleOpenTaskDialog(task)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle1">{task.title}</Typography>
                        <IconButton size="small" onClick={(e) => handleOpenMenu(e, task)}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      {task.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mt: 1, 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {task.description}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Chip 
                          label={task.priority} 
                          size="small" 
                          color={getPriorityColor(task.priority)} 
                          variant="outlined"
                        />
                        
                        {task.dueDate && (
                          <Chip
                            label={formatDate(task.dueDate)}
                            size="small"
                            color={isPastDue(task.dueDate) ? 'error' : 'default'}
                            variant="outlined"
                          />
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <Box sx={{ display: 'flex', flexGrow: 1 }}>
                          {task.assignees.slice(0, 3).map(assignee => (
                            <Avatar 
                              key={assignee._id} 
                              src={assignee.profilePicture} 
                              alt={assignee.username}
                              sx={{ width: 24, height: 24, mr: -0.5 }}
                            />
                          ))}
                          {task.assignees.length > 3 && (
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                              +{task.assignees.length - 3}
                            </Avatar>
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex' }}>
                          {getPreviousStatus(task.status) && (
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveTask(task, getPreviousStatus(task.status));
                              }}
                            >
                              <ArrowBackIcon fontSize="small" />
                            </IconButton>
                          )}
                          
                          {getNextStatus(task.status) && (
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveTask(task, getNextStatus(task.status));
                              }}
                            >
                              <ArrowForwardIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                  
                  {getTasksByStatus(column.id).length === 0 && (
                    <Box sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      p: 2,
                      color: 'text.secondary',
                      fontStyle: 'italic'
                    }}>
                      <Typography variant="body2">No tasks</Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onClose={handleCloseTaskDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={taskForm.title}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={taskForm.description}
                onChange={handleFormChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={taskForm.status}
                  onChange={handleFormChange}
                  label="Status"
                >
                  <MenuItem value="backlog">Backlog</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="review">Review</MenuItem>
                  <MenuItem value="done">Done</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={taskForm.priority}
                  onChange={handleFormChange}
                  label="Priority"
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Assignees</InputLabel>
                <Select
                  multiple
                  name="assignees"
                  value={taskForm.assignees}
                  onChange={handleMultipleSelectChange}
                  label="Assignees"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const member = data.getWorkspaceMembers.find(m => m._id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={member?.username} 
                            size="small"
                            avatar={<Avatar src={member?.profilePicture} />}
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {data.getWorkspaceMembers.map((member) => (
                    <MenuItem key={member._id} value={member._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={member.profilePicture} sx={{ width: 24, height: 24, mr: 1 }} />
                        {member.username}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Date"
                name="dueDate"
                type="date"
                value={taskForm.dueDate}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveTask}
            disabled={!taskForm.title}
          >
            {selectedTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => {
          handleCloseMenu();
          handleOpenTaskDialog(selectedTask);
        }}>
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteTask}>
          Delete
        </MenuItem>
      </Menu>
    </MainLayout>
  );
};

export default TaskBoard;