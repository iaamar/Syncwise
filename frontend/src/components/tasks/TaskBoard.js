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
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  MoreVert as MoreVertIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  HighPriority as HighPriorityIcon,
  Flag as MediumPriorityIcon,
  LowPriority as LowPriorityIcon,
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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
  const [error, setError] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'backlog',
    priority: 'medium',
    assignees: [],
    dueDate: '',
  });

  // Get workspace tasks
  const { loading, error: queryError, data, refetch } = useQuery(GET_WORKSPACE_TASKS, {
    variables: { workspaceId },
    fetchPolicy: 'network-only',
    onError: (err) => {
      setError(err.message);
    }
  });

  // Create task mutation
  const [createTask, { loading: createLoading }] = useMutation(CREATE_TASK, {
    onCompleted: () => {
      refetch();
      handleCloseTaskDialog();
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  // Update task mutation
  const [updateTask, { loading: updateLoading }] = useMutation(UPDATE_TASK, {
    onCompleted: () => {
      refetch();
      handleCloseTaskDialog();
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  // Delete task mutation
  const [deleteTask, { loading: deleteLoading }] = useMutation(DELETE_TASK, {
    onCompleted: () => {
      refetch();
      handleCloseTaskDialog();
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  // Handle task dialog
  const handleOpenTaskDialog = (task = null) => {
    setError(null);
    
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
    setError(null);
    
    if (!taskForm.title.trim()) {
      setError("Task title is required");
      return;
    }

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
      // Error is handled in mutation callbacks
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
      setError(err.message);
    }
  };

  // Handle drag and drop
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    // Drop outside any droppable or same position
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }
    
    // Find the task
    const task = data?.getWorkspaceTasks.find(t => t._id === draggableId);
    if (!task) return;
    
    // Update task status
    await handleMoveTask(task, destination.droppableId);
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
    if (!dateString) return 'No due date';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'No due date';
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'No due date';
    }
  };

  // Check if date is past due
  const isPastDue = (dateString) => {
    if (!dateString) return false;
    
    try {
      const dueDate = new Date(dateString);
      if (isNaN(dueDate.getTime())) return false;
      
      const today = new Date();
      return dueDate < today;
    } catch (error) {
      return false;
    }
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

  if (queryError && !data) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            Error loading tasks: {queryError.message}
          </Alert>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
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

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <Grid container spacing={2}>
            {columnStatuses.map(column => (
              <Grid item xs={12} sm={6} md={3} key={column.id}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 300 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{column.title}</Typography>
                    <Chip 
                      label={getTasksByStatus(column.id).length} 
                      size="small" 
                      color="primary" 
                    />
                  </Box>
                  
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                          flexGrow: 1,
                          minHeight: '200px',
                          bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'background.default',
                          p: 1,
                          borderRadius: 1,
                          overflow: 'auto',
                        }}
                      >
                        {getTasksByStatus(column.id).map((task, index) => (
                          <Draggable
                            key={task._id}
                            draggableId={task._id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Paper
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                elevation={snapshot.isDragging ? 6 : 1}
                                sx={{
                                  p: 2,
                                  mb: 2,
                                  '&:hover': {
                                    boxShadow: 3,
                                  },
                                  cursor: 'pointer',
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
                                      >
                                        {assignee.username.charAt(0).toUpperCase()}
                                      </Avatar>
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
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
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
                    )}
                  </Droppable>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DragDropContext>
      </Box>

      {/* Task Dialog */}
      <Dialog 
        open={taskDialogOpen} 
        onClose={handleCloseTaskDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>{selectedTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="normal"
                id="title"
                name="title"
                label="Task Title"
                type="text"
                fullWidth
                variant="outlined"
                value={taskForm.title}
                onChange={handleFormChange}
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="normal"
                id="description"
                name="description"
                label="Description"
                type="text"
                fullWidth
                variant="outlined"
                multiline
                rows={4}
                value={taskForm.description}
                onChange={handleFormChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
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
              <FormControl fullWidth margin="normal">
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={taskForm.priority}
                  onChange={handleFormChange}
                  label="Priority"
                >
                  <MenuItem value="high">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <HighPriorityIcon color="error" sx={{ mr: 1 }} />
                      High
                    </Box>
                  </MenuItem>
                  <MenuItem value="medium">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MediumPriorityIcon color="warning" sx={{ mr: 1 }} />
                      Medium
                    </Box>
                  </MenuItem>
                  <MenuItem value="low">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LowPriorityIcon color="success" sx={{ mr: 1 }} />
                      Low
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
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
                        const member = data?.getWorkspaceMembers?.find(m => m._id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={member?.username || "User"} 
                            size="small"
                            avatar={<Avatar src={member?.profilePicture} />}
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {data?.getWorkspaceMembers?.map((member) => (
                    <MenuItem key={member._id} value={member._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          src={member.profilePicture} 
                          sx={{ width: 24, height: 24, mr: 1 }} 
                        >
                          {member.username.charAt(0).toUpperCase()}
                        </Avatar>
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
                margin="normal"
                label="Due Date"
                type="date"
                name="dueDate"
                value={taskForm.dueDate || ''}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0] // Sets min date to today
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveTask}
            disabled={!taskForm.title || createLoading || updateLoading}
            startIcon={createLoading || updateLoading ? <CircularProgress size={20} /> : null}
          >
            {createLoading || updateLoading 
              ? (selectedTask ? 'Updating...' : 'Creating...') 
              : (selectedTask ? 'Update' : 'Create')}
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
        <MenuItem 
          onClick={handleDeleteTask}
          disabled={deleteLoading}
          sx={{ color: 'error.main' }}
        >
          {deleteLoading ? 'Deleting...' : 'Delete'}
        </MenuItem>
      </Menu>
    </MainLayout>
  );
};

export default TaskBoard;