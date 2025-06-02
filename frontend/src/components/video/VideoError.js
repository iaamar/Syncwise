import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Videocam as VideocamIcon,
  Mic as MicIcon,
} from '@mui/icons-material';

const VideoError = ({ open, onClose, error, onRetry }) => {
  const getErrorMessage = () => {
    switch (error?.name) {
      case 'NotAllowedError':
        return {
          title: 'Permission Denied',
          message: 'Please allow access to your camera and microphone to join the meeting.',
          icon: <ErrorIcon color="error" sx={{ fontSize: 48 }} />,
        };
      case 'NotFoundError':
        return {
          title: 'Device Not Found',
          message: 'No camera or microphone found. Please connect a device and try again.',
          icon: error.constraint === 'video' ? 
            <VideocamIcon color="error" sx={{ fontSize: 48 }} /> :
            <MicIcon color="error" sx={{ fontSize: 48 }} />,
        };
      case 'NotReadableError':
        return {
          title: 'Device Error',
          message: 'Your camera or microphone is already in use by another application.',
          icon: <ErrorIcon color="error" sx={{ fontSize: 48 }} />,
        };
      default:
        return {
          title: 'Connection Error',
          message: 'An error occurred while trying to join the meeting. Please try again.',
          icon: <ErrorIcon color="error" sx={{ fontSize: 48 }} />,
        };
    }
  };

  const errorDetails = getErrorMessage();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        {errorDetails.title}
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 2,
          }}
        >
          {errorDetails.icon}
          <Typography sx={{ mt: 2, textAlign: 'center' }}>
            {errorDetails.message}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onRetry} variant="contained" autoFocus>
          Try Again
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VideoError;