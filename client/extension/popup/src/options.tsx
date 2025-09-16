import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Save, Refresh } from '@mui/icons-material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});

interface Settings {
  mode: 'local' | 'remote';
  apiUrl: string;
  apiKey: string;
  realTimeMonitoring: boolean;
  autoScan: boolean;
}

const AgentShieldOptions: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    mode: 'local',
    apiUrl: 'http://localhost:5000/api',
    apiKey: '',
    realTimeMonitoring: true,
    autoScan: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response) {
        setSettings(response);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      setMessage(null);

      await chrome.runtime.sendMessage({
        action: 'updateSettings',
        data: settings
      });

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Settings) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            AgentShield Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure your AgentShield extension settings
          </Typography>
        </Box>

        {message && (
          <Alert 
            severity={message.type} 
            sx={{ mb: 3 }} 
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Mode</InputLabel>
                  <Select
                    value={settings.mode}
                    onChange={handleInputChange('mode')}
                    label="Mode"
                  >
                    <MenuItem value="local">Local (Offline)</MenuItem>
                    <MenuItem value="remote">Remote (API)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {settings.mode === 'remote' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="API URL"
                      value={settings.apiUrl}
                      onChange={handleInputChange('apiUrl')}
                      placeholder="http://localhost:5000/api"
                      helperText="URL of your AgentShield server API"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="API Key"
                      type="password"
                      value={settings.apiKey}
                      onChange={handleInputChange('apiKey')}
                      placeholder="Your API key"
                      helperText="API key for authentication (optional)"
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.realTimeMonitoring}
                      onChange={handleInputChange('realTimeMonitoring')}
                    />
                  }
                  label="Real-time Monitoring"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Monitor conversations in real-time for security threats
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoScan}
                      onChange={handleInputChange('autoScan')}
                    />
                  }
                  label="Auto Scan"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Automatically scan new conversations
                </Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={loading ? <Refresh /> : <Save />}
                onClick={saveSettings}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={loadSettings}
                disabled={loading}
              >
                Reset
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              About AgentShield
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              AgentShield is a comprehensive security testing tool for AI agents. 
              It helps detect vulnerabilities like prompt injection, data exfiltration, 
              role confusion, and other security threats in LLM applications.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Supported Platforms:</strong> ChatGPT, Claude, Bard, and other LLM interfaces
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Version:</strong> 1.0.0
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AgentShieldOptions />
  </React.StrictMode>
);
