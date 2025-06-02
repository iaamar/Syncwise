const Task = require('../../models/Task');
const User = require('../../models/User');
const Workspace = require('../../models/Workspace');
const { isAuthenticated } = require('../../middleware/auth');

module.exports = {
  Query: {
    getWorkspaceTasks: async (_, { workspaceId }, { user }) => {
      isAuthenticated(user);
      
      const tasks = await Task.find({ workspaceId })
        .populate('assignees')
        .populate('createdBy')
        .sort({ updatedAt: -1 });
      
      return tasks;
    },
    
    getTask: async (_, { id }, { user }) => {
      isAuthenticated(user);
      
      const task = await Task.findById(id)
        .populate('assignees')
        .populate('createdBy')
        .populate('comments.user');
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      return task;
    },
    
    getTasksByAssignee: async (_, { assigneeId }, { user }) => {
      isAuthenticated(user);
      
      const tasks = await Task.find({ assignees: assigneeId })
        .populate('assignees')
        .populate('createdBy')
        .sort({ updatedAt: -1 });
      
      return tasks;
    },
  },
  
  Mutation: {
    createTask: async (_, { input }, { user }) => {
      isAuthenticated(user);
      
      const { title, description, workspaceId, status, priority, assignees, dueDate, attachments } = input;
      
      // Create task
      const task = new Task({
        title,
        description,
        workspaceId,
        status: status || 'backlog',
        priority: priority || 'medium',
        assignees: assignees || [],
        dueDate,
        attachments: attachments || [],
        createdBy: user._id,
      });
      
      await task.save();
      await task.populate('assignees');
      await task.populate('createdBy');
      
      return task;
    },
    
    updateTask: async (_, { id, input }, { user }) => {
      isAuthenticated(user);
      
      const task = await Task.findById(id);
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Update task properties
      if (input.title) task.title = input.title;
      if (input.description !== undefined) task.description = input.description;
      if (input.status) task.status = input.status;
      if (input.priority) task.priority = input.priority;
      if (input.assignees) task.assignees = input.assignees;
      if (input.dueDate !== undefined) task.dueDate = input.dueDate;
      if (input.attachments) task.attachments = input.attachments;
      
      await task.save();
      await task.populate('assignees');
      await task.populate('createdBy');
      
      return task;
    },
    
    deleteTask: async (_, { id }, { user }) => {
      isAuthenticated(user);
      
      const task = await Task.findById(id);
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      await Task.findByIdAndDelete(id);
      
      return true;
    },
    
    addTaskComment: async (_, { input }, { user }) => {
      isAuthenticated(user);
      
      const { taskId, content } = input;
      
      const task = await Task.findById(taskId);
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Add comment
      task.comments.push({
        user: user._id,
        content,
        createdAt: new Date(),
      });
      
      await task.save();
      await task.populate('assignees');
      await task.populate('createdBy');
      await task.populate('comments.user');
      
      return task;
    },
  },
  
  Task: {
    assignees: async (parent) => {
      return User.find({ _id: { $in: parent.assignees } });
    },
    
    createdBy: async (parent) => {
      return User.findById(parent.createdBy);
    },
    
    comments: async (parent) => {
      // Populate user information for each comment
      const populatedComments = [];
      
      for (const comment of parent.comments) {
        const user = await User.findById(comment.user);
        
        populatedComments.push({
          ...comment.toObject(),
          user,
        });
      }
      
      return populatedComments;
    },
  },
};