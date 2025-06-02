import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Grid,
  IconButton,
  Tabs,
  Tab,
  InputAdornment,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  useTheme,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Camera as CameraIcon,
  BrightnessAuto as BrightnessAutoIcon,
  RemoveRedEye as RemoveRedEyeIcon,
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';

// AI-powered avatar color generator
const generateAvatarColor = (username) => {
  const colors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
    '#FF5722', '#795548', '#9E9E9E', '#607D8B'
  ];
  
  // Generate a consistent number based on username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Map to color index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Generated username initials
const getInitials = (username) => {
  if (!username) return '?';
  
  const parts = username.split(/[\s._-]/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  return username.substring(0, 2).toUpperCase();
};

const UserProfile = () => {
  const { user, updateProfile, updatePassword, checkPasswordStrength, generateSecurePassword } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const fileInputRef = useRef(null);
  const theme = useTheme();
  
  // Profile tab state
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    profilePicture: '',
    status: 'online',
  });
  
  // Security tab state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  // Preferences tab state
  const [preferences, setPreferences] = useState({
    darkMode: theme.palette.mode === 'dark',
    emailNotifications: true,
    desktopNotifications: false,
    soundEffects: true,
    language: 'english',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  
  // Set initial profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        profilePicture: user.profilePicture || '',
        status: user.status || 'online',
      });
    }
  }, [user]);
  
  // Check password strength when password changes
  useEffect(() => {
    if (passwordData.newPassword) {
      const strength = checkPasswordStrength(passwordData.newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: '' });
    }
  }, [passwordData.newPassword, checkPasswordStrength]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle profile data change
  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };
  
  // Handle password data change
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };
  
  // Handle preferences change
  const handlePreferencesChange = (e) => {
    setPreferences({
      ...preferences,
      [e.target.name]: typeof e.target.checked !== 'undefined' ? e.target.checked : e.target.value,
    });
  };
  
  // Handle file input change (profile picture)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      setAlert({
        open: true,
        message: 'Invalid file type. Please upload a JPEG, PNG, or GIF image.',
        severity: 'error',
      });
      return;
    }
    
    if (file.size > maxSize) {
      setAlert({
        open: true,
        message: 'File is too large. Maximum size is 5MB.',
        severity: 'error',
      });
      return;
    }
    
    // In a real app, you would upload to a server/S3 here
    // For this example, we'll use a FileReader to convert to base64
    setUploadingImage(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const base64String = event.target.result;
        
        // Update profile data with new image
        setProfileData({
          ...profileData,
          profilePicture: base64String,
        });
        
        setUploadingImage(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingImage(false);
      setAlert({
        open: true,
        message: 'Failed to process image. Please try again.',
        severity: 'error',
      });
    }
  };
  
  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  
  // Handle update profile
  const handleUpdateProfile = async () => {
    setLoading(true);
    
    try {
      const result = await updateProfile({
        profilePicture: profileData.profilePicture,
        status: profileData.status,
      });
      
      if (result.success) {
        setEditMode(false);
        setAlert({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success',
        });
      } else {
        setAlert({
          open: true,
          message: result.error || 'Failed to update profile',
          severity: 'error',
        });
      }
    } catch (error) {
      setAlert({
        open: true,
        message: 'An unexpected error occurred',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle update password
  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({
        open: true,
        message: 'Passwords do not match',
        severity: 'error',
      });
      return;
    }
    
    if (passwordStrength.score < 3) {
      setAlert({
        open: true,
        message: 'Password is too weak. Please choose a stronger password.',
        severity: 'error',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (result.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        setAlert({
          open: true,
          message: 'Password updated successfully',
          severity: 'success',
        });
      } else {
        setAlert({
          open: true,
          message: result.error || 'Failed to update password',
          severity: 'error',
        });
      }
    } catch (error) {
      setAlert({
        open: true,
        message: 'An unexpected error occurred',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle generate password
  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword();
    setPasswordData({
      ...passwordData,
      newPassword,
      confirmPassword: newPassword,
    });
    setShowNewPassword(true);
    
    // Open password dialog to show the generated password
    setPasswordDialogOpen(true);
  };
  
  // Handle close alert
  const handleCloseAlert = () => {
    setAlert({
      ...alert,
      open: false,
    });
  };
  
  // AI recommended profile data
  const getProfileCompleteness = () => {
    let score = 0;
    
    if (profileData.username) score += 25;
    if (profileData.email) score += 25;
    if (profileData.profilePicture) score += 25;
    if (profileData.status) score += 25;
    
    return score;
  };
  
  // Render profile tab
  const renderProfileTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/jpeg, image/png, image/gif"
          onChange={handleFileChange}
        />
        
        <Box sx={{ position: 'relative' }}>
          {profileData.profilePicture ? (
            <Avatar
              src={profileData.profilePicture}
              alt={profileData.username}
              sx={{ width: 100, height: 100, mr: 3 }}
            />
          ) : (
            <Avatar
              sx={{ 
                width: 100, 
                height: 100, 
                mr: 3,
                bgcolor: generateAvatarColor(profileData.username || 'user'),
                fontSize: '2rem',
              }}
            >
              {getInitials(profileData.username || 'User')}
            </Avatar>
          )}
          
          {editMode && (
            <IconButton
              color="primary"
              onClick={handleUploadClick}
              disabled={uploadingImage}
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 12,
                backgroundColor: 'background.paper',
                boxShadow: 1,
                '&:hover': {
                  backgroundColor: 'background.default',
                },
              }}
              size="small"
            >
              {uploadingImage ? (
                <CircularProgress size={24} />
              ) : (
                <CameraIcon fontSize="small" />
              )}
            </IconButton>
          )}
        </Box>
        
        <Box>
          <Typography variant="h5">{profileData.username}</Typography>
          <Typography variant="body1" color="text.secondary">
            {profileData.email}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              mt: 0.5,
              color: profileData.status === 'online' 
                ? 'success.main' 
                : (profileData.status === 'away' ? 'warning.main' : 'text.secondary'),
            }}
          >
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                mr: 1,
                bgcolor: profileData.status === 'online' 
                  ? 'success.main' 
                  : (profileData.status === 'away' ? 'warning.main' : 'text.secondary'),
              }}
            />
            {profileData.status === 'online' ? 'Online' : (profileData.status === 'away' ? 'Away' : 'Offline')}
          </Typography>
        </Box>
        
        <Box sx={{ ml: 'auto' }}>
          {!editMode ? (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<CancelIcon />}
                onClick={() => setEditMode(false)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleUpdateProfile}
                disabled={loading}
              >
                Save
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />
      
      {/* Profile form */}
      {editMode ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={profileData.username}
              InputProps={{ readOnly: true }}
              disabled
              helperText="Username cannot be changed"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={profileData.email}
              InputProps={{ readOnly: true }}
              disabled
              helperText="Contact support to change your email"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={profileData.status}
                onChange={handleProfileChange}
                label="Status"
              >
                <MenuItem value="online">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'success.main',
                        mr: 1 
                      }}
                    />
                    Online
                  </Box>
                </MenuItem>
                <MenuItem value="away">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'warning.main',
                        mr: 1
                      }}
                    />
                    Away
                  </Box>
                </MenuItem>
                <MenuItem value="offline">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'text.secondary',
                        mr: 1
                      }}
                    />
                    Offline
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      ) : (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Completeness
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={getProfileCompleteness()} 
                sx={{ height: 10, borderRadius: 5, mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {getProfileCompleteness()}% complete
              </Typography>
            </CardContent>
          </Card>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Username
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="body1">{profileData.username}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Email
                  </Typography>
                  <Typography variant="body1">{profileData.email}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
  
  // Render security tab
  const renderSecurityTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Change Password
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            margin="normal"
            required
            name="currentPassword"
            label="Current Password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleGeneratePassword}
          >
            Generate Secure Password
          </Button>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            margin="normal"
            required
            name="newPassword"
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {passwordData.newPassword && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography 
                  variant="caption" 
                  color={
                    passwordStrength.score <= 1
                      ? 'error.main'
                      : passwordStrength.score <= 3
                      ? 'warning.main'
                      : 'success.main'
                  }
                >
                  {passwordStrength.score <= 1
                    ? 'Weak'
                    : passwordStrength.score <= 3
                    ? 'Good'
                    : 'Strong'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {passwordStrength.score}/5
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(passwordStrength.score / 5) * 100}
                color={
                  passwordStrength.score <= 1
                    ? 'error'
                    : passwordStrength.score <= 3
                    ? 'warning'
                    : 'success'
                }
                sx={{ height: 4, borderRadius: 2 }}
              />
              {passwordStrength.feedback && passwordStrength.feedback !== 'Password is strong' && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {passwordStrength.feedback}
                </Typography>
              )}
            </Box>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            margin="normal"
            required
            name="confirmPassword"
            label="Confirm New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            error={
              passwordData.newPassword !== passwordData.confirmPassword &&
              passwordData.confirmPassword !== ''
            }
            helperText={
              passwordData.newPassword !== passwordData.confirmPassword &&
              passwordData.confirmPassword !== ''
                ? 'Passwords do not match'
                : ''
            }
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpdatePassword}
          disabled={
            loading ||
            !passwordData.currentPassword ||
            !passwordData.newPassword ||
            !passwordData.confirmPassword ||
            passwordData.newPassword !== passwordData.confirmPassword ||
            passwordStrength.score < 2
          }
          startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
        >
          Update Password
        </Button>
      </Box>
      
      <Divider sx={{ my: 4 }} />
      
      <Typography variant="h6" gutterBottom>
        Login History
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Recent logins to your account
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2">
            <strong>Current session</strong> • {new Date().toLocaleString()}
          </Typography>
          <Typography variant="body2" color="success.main">
            Active now
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Browser: {navigator.userAgent.split(' ').slice(-1)[0].split('/')[0]}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          IP Address: (Hidden for privacy)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Location: {Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ')}
        </Typography>
      </Paper>
    </Box>
  );
  
  // Render preferences tab
  const renderPreferencesTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Application Settings
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Appearance
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={preferences.darkMode}
              onChange={handlePreferencesChange}
              name="darkMode"
            />
          }
          label="Dark Mode"
        />
        
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BrightnessAutoIcon />}
            size="small"
          >
            Auto-detect preferred theme
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Notifications
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.emailNotifications}
                  onChange={handlePreferencesChange}
                  name="emailNotifications"
                />
              }
              label="Email Notifications"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.desktopNotifications}
                  onChange={handlePreferencesChange}
                  name="desktopNotifications"
                />
              }
              label="Desktop Notifications"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.soundEffects}
                  onChange={handlePreferencesChange}
                  name="soundEffects"
                />
              }
              label="Sound Effects"
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Regional Settings
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="language-label">Language</InputLabel>
              <Select
                labelId="language-label"
                value={preferences.language}
                onChange={handlePreferencesChange}
                name="language"
                label="Language"
              >
                <MenuItem value="english">English</MenuItem>
                <MenuItem value="spanish">Spanish</MenuItem>
                <MenuItem value="french">French</MenuItem>
                <MenuItem value="german">German</MenuItem>
                <MenuItem value="japanese">Japanese</MenuItem>
                <MenuItem value="chinese">Chinese</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="timezone-label">Timezone</InputLabel>
              <Select
                labelId="timezone-label"
                value={preferences.timezone}
                onChange={handlePreferencesChange}
                name="timezone"
                label="Timezone"
              >
                <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
                <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                <MenuItem value="Europe/London">London (GMT)</MenuItem>
                <MenuItem value="Europe/Paris">Paris (CET)</MenuItem>
                <MenuItem value="Asia/Tokyo">Tokyo (JST)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
          >
            Save Preferences
          </Button>
        </Box>
      </Paper>
    </Box>
  );

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Typography variant="h4" gutterBottom>
            My Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your personal information and account settings
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
          {/* Tabs */}
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<AccountCircleIcon />} 
              label="Profile" 
              id="profile-tab"
              aria-controls="profile-tabpanel"
            />
            <Tab 
              icon={<SecurityIcon />} 
              label="Security" 
              id="security-tab"
              aria-controls="security-tabpanel"
            />
            <Tab 
              icon={<NotificationsIcon />} 
              label="Preferences" 
              id="preferences-tab"
              aria-controls="preferences-tabpanel"
            />
          </Tabs>
          
          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            <div
              role="tabpanel"
              hidden={activeTab !== 0}
              id="profile-tabpanel"
              aria-labelledby="profile-tab"
            >
              {activeTab === 0 && renderProfileTab()}
            </div>
            
            <div
              role="tabpanel"
              hidden={activeTab !== 1}
              id="security-tabpanel"
              aria-labelledby="security-tab"
            >
              {activeTab === 1 && renderSecurityTab()}
            </div>
            
            <div
              role="tabpanel"
              hidden={activeTab !== 2}
              id="preferences-tabpanel"
              aria-labelledby="preferences-tab"
            >
              {activeTab === 2 && renderPreferencesTab()}
            </div>
          </Box>
        </Paper>
      </Box>
      
      {/* Alerts */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
      
      {/* Password generated dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        aria-labelledby="password-dialog-title"
      >
        <DialogTitle id="password-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SecurityIcon sx={{ mr: 1 }} />
            Generated Secure Password
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            We've generated a strong, secure password for you:
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 1,
              mb: 2,
            }}
          >
            <Typography variant="body1" fontFamily="monospace">
              {passwordData.newPassword}
            </Typography>
            <Tooltip title="Copy to clipboard">
              <IconButton
                onClick={() => {
                  navigator.clipboard.writeText(passwordData.newPassword);
                  setAlert({
                    open: true,
                    message: 'Password copied to clipboard',
                    severity: 'success',
                  });
                }}
                size="small"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Alert severity="warning">
            Make sure to remember this password or save it in a secure password manager. It will not be shown again.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)} color="primary">
            I've saved it
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default UserProfile;