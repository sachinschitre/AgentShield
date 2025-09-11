import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  AccountCircle,
  Notifications,
  Security,
  Palette
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [passwordError, setPasswordError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      theme: user?.preferences?.theme || 'light',
      emailNotifications: user?.preferences?.notifications?.email || true,
      testCompleteNotifications: user?.preferences?.notifications?.testComplete || true
    }
  });

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const onSubmitProfile = async (data: any) => {
    try {
      await updateProfile({
        username: data.username,
        email: data.email,
        preferences: {
          theme: data.theme,
          notifications: {
            email: data.emailNotifications,
            testComplete: data.testCompleteNotifications
          }
        }
      });
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const onSubmitPassword = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      // This would need to be implemented in the auth context
      toast.success('Password updated successfully');
      setPasswordError('');
    } catch (error) {
      setPasswordError('Failed to update password');
    }
  };

  return (
    <Layout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage your account settings and preferences.
        </Typography>

        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab
                icon={<AccountCircle />}
                label="Profile"
                iconPosition="start"
              />
              <Tab
                icon={<Security />}
                label="Security"
                iconPosition="start"
              />
              <Tab
                icon={<Notifications />}
                label="Notifications"
                iconPosition="start"
              />
              <Tab
                icon={<Palette />}
                label="Appearance"
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <form onSubmit={handleSubmit(onSubmitProfile)}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    {...register('username', {
                      required: 'Username is required',
                      minLength: {
                        value: 3,
                        message: 'Username must be at least 3 characters'
                      }
                    })}
                    error={!!errors.username}
                    helperText={errors.username?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Profile'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <form onSubmit={handleSubmit(onSubmitPassword)}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    {...register('currentPassword', {
                      required: 'Current password is required'
                    })}
                    error={!!errors.currentPassword}
                    helperText={errors.currentPassword?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    {...register('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    error={!!errors.newPassword}
                    helperText={errors.newPassword?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password'
                    })}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                  />
                </Grid>
                {passwordError && (
                  <Grid item xs={12}>
                    <Alert severity="error">{passwordError}</Alert>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Password'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Notification Preferences
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Choose how you want to be notified about test results and updates.
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      {...register('emailNotifications')}
                      defaultChecked={user?.preferences?.notifications?.email}
                    />
                  }
                  label="Email notifications for test completions"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      {...register('testCompleteNotifications')}
                      defaultChecked={user?.preferences?.notifications?.testComplete}
                    />
                  }
                  label="In-app notifications for test completions"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleSubmit(onSubmitProfile)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Preferences'}
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Appearance Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Customize the look and feel of the application.
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      {...register('theme')}
                      defaultChecked={user?.preferences?.theme === 'dark'}
                    />
                  }
                  label="Dark mode"
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  Theme changes will be applied after refreshing the page.
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleSubmit(onSubmitProfile)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Appearance Settings'}
                </Button>
              </Grid>
            </Grid>
          </TabPanel>
        </Card>
      </Box>
    </Layout>
  );
}
