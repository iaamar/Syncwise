import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection with reconnection options
      const token = localStorage.getItem('token');
      if (!token) {
        setConnectionError('Authentication token missing');
        return;
      }

      // Create socket instance
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
        auth: {
          token: token,
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        setConnectionError(error.message);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('reconnect_attempt', (attempt) => {
        console.log(`Socket reconnection attempt ${attempt}`);
        setReconnectAttempts(attempt);
      });

      newSocket.on('reconnect', () => {
        console.log('Socket reconnected');
        setIsConnected(true);
        setConnectionError(null);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
        setConnectionError('Maximum reconnection attempts reached');
      });

      // Store socket instance
      setSocket(newSocket);

      // Clean up on unmount
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } else {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      connectionError,
      reconnectAttempts
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);