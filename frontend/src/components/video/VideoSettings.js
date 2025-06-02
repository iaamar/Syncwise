import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  VolumeUp as VolumeUpIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const VideoSettings = ({ open, onClose, onApply, previewStream, setPreviewStream }) => {
  const { deviceSettings, updateDeviceSettings, getAvailableDevices } = useAuth();
  const [devices, setDevices] = useState({ audioInputs: [], audioOutputs: [], videoInputs: [] });
  const [selectedDevices, setSelectedDevices] = useState(deviceSettings);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioContext, setAudioContext] = useState(null);
  const [audioAnalyser, setAudioAnalyser] = useState(null);

  // Load available devices
  useEffect(() => {
    const loadDevices = async () => {
      const availableDevices = await getAvailableDevices();
      setDevices(availableDevices);
    };
    
    loadDevices();
  }, [getAvailableDevices]);

  // Handle preview stream
  useEffect(() => {
    const startPreview = async () => {
      try {
        if (previewStream) {
          previewStream.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: selectedDevices.audioInput },
          video: { deviceId: selectedDevices.videoInput },
        });

        setPreviewStream(stream);

        // Setup audio analysis
        if (!audioContext) {
          const context = new (window.AudioContext || window.webkitAudioContext)();
          const analyser = context.createAnalyser();
          analyser.fftSize = 256;
          
          setAudioContext(context);
          setAudioAnalyser(analyser);
        }

        if (audioContext && stream.getAudioTracks().length > 0) {
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(audioAnalyser);
          
          const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
          
          const updateAudioLevel = () => {
            audioAnalyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average);
            
            if (open) {
              requestAnimationFrame(updateAudioLevel);
            }
          };
          
          updateAudioLevel();
        }

      } catch (err) {
        console.error('Error starting device preview:', err);
      }
    };

    if (open) {
      startPreview();
    }

    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [open, selectedDevices, audioContext, audioAnalyser]);

  // Handle device changes
  const handleDeviceChange = (type, deviceId) => {
    setSelectedDevices(prev => ({
      ...prev,
      [type]: deviceId,
    }));
  };

  // Toggle audio/video
  const toggleAudio = () => {
    if (previewStream) {
      previewStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (previewStream) {
      previewStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Apply settings
  const handleApply = () => {
    updateDeviceSettings(selectedDevices);
    onApply(selectedDevices);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Device Settings</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Preview */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Preview
            </Typography>
            <Paper
              sx={{
                position: 'relative',
                width: '100%',
                paddingTop: '56.25%',
                backgroundColor: 'black',
                overflow: 'hidden',
              }}
            >
              <video
                autoPlay
                playsInline
                muted
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                srcObject={previewStream}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <IconButton
                  size="small"
                  onClick={toggleAudio}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={toggleVideo}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>
              </Box>
            </Paper>

            {/* Audio meter */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <VolumeUpIcon />
              <Box
                sx={{
                  flex: 1,
                  height: 4,
                  bgcolor: 'grey.300',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${(audioLevel / 255) * 100}%`,
                    bgcolor: 'primary.main',
                    transition: 'width 0.1s',
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Device selection */}
          <Box sx={{ flex: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Camera</InputLabel>
              <Select
                value={selectedDevices.videoInput || ''}
                onChange={(e) => handleDeviceChange('videoInput', e.target.value)}
                label="Camera"
              >
                {devices.videoInputs.map((device) => (
                  <MenuItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Microphone</InputLabel>
              <Select
                value={selectedDevices.audioInput || ''}
                onChange={(e) => handleDeviceChange('audioInput', e.target.value)}
                label="Microphone"
              >
                {devices.audioInputs.map((device) => (
                  <MenuItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Speaker</InputLabel>
              <Select
                value={selectedDevices.audioOutput || ''}
                onChange={(e) => handleDeviceChange('audioOutput', e.target.value)}
                label="Speaker"
              >
                {devices.audioOutputs.map((device) => (
                  <MenuItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Speaker ${device.deviceId}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleApply} variant="contained">
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VideoSettings;