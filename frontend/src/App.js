import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Logout from './pages/Logout';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import TaskBoard from './pages/TaskBoard';
import ChatRoom from './pages/ChatRoom';
import VideoCall from './pages/VideoCall';
import UserProfile from './pages/UserProfile';
import NotFound from './pages/NotFound';
import ExploreWorkspaces from './pages/ExploreWorkspaces';
import Invitations from './pages/Invitations';
import Meetings from './pages/Meetings';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/logout" element={<Logout />} />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <ExploreWorkspaces />
          </ProtectedRoute>
        }
      />

      <Route
        path="/invitations"
        element={
          <ProtectedRoute>
            <Invitations />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/workspace/:workspaceId"
        element={
          <ProtectedRoute>
            <Workspace />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/workspace/:workspaceId/tasks"
        element={
          <ProtectedRoute>
            <TaskBoard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/workspace/:workspaceId/chat/:channelId"
        element={
          <ProtectedRoute>
            <ChatRoom />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/workspace/:workspaceId/meetings"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workspace/:workspaceId/meetings"
        element={
          <ProtectedRoute>
            <Meetings />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/video/:roomId"
        element={
          <ProtectedRoute>
            <VideoCall />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      
      {/* Redirect to dashboard if already authenticated */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
      />
      
      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;