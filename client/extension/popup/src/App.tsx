import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Security,
  BugReport,
  Assessment,
  Refresh,
  Download,
  Settings,
  History,
  Info,
  Warning,
  Error,
  CheckCircle
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';

interface TestResult {
  name: string;
  passed: boolean;
  severity: string;
  evidence: string;
  duration: number;
  timestamp: string;
}

interface Remediation {
  title: string;
  description: string;
  priority: string;
  estimatedEffort: string;
  category: string;
}

interface ScanResult {
  id: string;
  timestamp: string;
  url: string;
  domain: string;
  results: {
    score: number;
    severity: string;
    summary: string;
    tests: TestResult[];
    remediation: Remediation[];
  };
}

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const COLORS = {
  Critical: '#f44336',
  High: '#ff9800',
  Medium: '#ffc107',
  Low: '#4caf50',
  passed: '#4caf50',
  failed: '#f44336'
};

const AgentShieldPopup: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get scan history
      const historyResponse = await chrome.runtime.sendMessage({ action: 'getScanHistory' });
      setScanHistory(historyResponse || []);
      
      // Get settings
      const settingsResponse = await chrome.runtime.sendMessage({ action: 'getSettings' });
      setSettings(settingsResponse);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scanCurrentTab = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id || !tab.url) {
        throw new Error('No active tab found');
      }

      // Check if it's a supported site
      const supportedSites = ['chat.openai.com', 'claude.ai', 'bard.google.com'];
      const isSupported = supportedSites.some(site => tab.url!.includes(site));
      
      if (!isSupported) {
        throw new Error('Current tab is not a supported AI platform');
      }

      // Run scan directly
      const scanData = {
        platform: detectPlatform(tab.url!),
        url: tab.url!,
        context: { 
          messages: [], 
          metadata: { 
            url: tab.url!, 
            timestamp: new Date().toISOString() 
          } 
        },
        timestamp: new Date().toISOString(),
        tests: ['prompt-injection', 'jailbreaking', 'role-confusion', 'data-exfiltration']
      };

      const response = await chrome.runtime.sendMessage({
        action: 'scanAgent',
        data: scanData
      });

      if (response.success) {
        // Add to scan history
        const newScan = response.data;
        setScanHistory(prev => [newScan, ...prev]);
      } else {
        throw new Error(response.error || 'Scan failed');
      }

      // Reload data to show new scan
      await loadData();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const detectPlatform = (url: string) => {
    if (url.includes('chat.openai.com')) return 'ChatGPT';
    if (url.includes('claude.ai')) return 'Claude';
    if (url.includes('bard.google.com')) return 'Bard';
    return 'Unknown';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return <Error color="error" />;
      case 'High':
        return <Warning color="warning" />;
      case 'Medium':
        return <Info color="info" />;
      case 'Low':
        return <CheckCircle color="success" />;
      default:
        return <Info />;
    }
  };

  const getSeverityColor = (severity: string) => {
    return COLORS[severity as keyof typeof COLORS] || '#666';
  };

  const exportResults = (result: ScanResult) => {
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agentshield-scan-${result.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const prepareChartData = (result: ScanResult) => {
    const severityCounts = result.results.tests.reduce((acc, test) => {
      if (!test.passed) {
        acc[test.severity] = (acc[test.severity] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(severityCounts).map(([severity, count]) => ({
      name: severity,
      value: count,
      color: getSeverityColor(severity)
    }));
  };

  const latestScan = scanHistory[0];

  return (
    <Box sx={{ width: 400, height: 600 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Dashboard" />
          <Tab label="History" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Container maxWidth="sm" sx={{ py: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Security sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" component="h1" gutterBottom>
              AgentShield
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI Agent Security Scanner
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} /> : <Security />}
              onClick={scanCurrentTab}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? 'Scanning...' : 'Scan Current Tab'}
            </Button>
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Refresh />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {latestScan && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Latest Scan Results
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getSeverityIcon(latestScan.results.severity)}
                  <Typography variant="h4" sx={{ ml: 1, color: getSeverityColor(latestScan.results.severity) }}>
                    {latestScan.results.score}/100
                  </Typography>
                  <Chip
                    label={latestScan.results.severity}
                    size="small"
                    sx={{ ml: 2, backgroundColor: getSeverityColor(latestScan.results.severity), color: 'white' }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {latestScan.results.summary}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {new Date(latestScan.timestamp).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          )}

          {latestScan && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vulnerability Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={prepareChartData(latestScan)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareChartData(latestScan).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {!latestScan && !loading && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <BugReport sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Scans Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click "Scan Current Tab" to start scanning AI agents for security vulnerabilities.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Container>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Container maxWidth="sm" sx={{ py: 2 }}>
          <Typography variant="h6" gutterBottom>
            Scan History
          </Typography>
          
          {scanHistory.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Scan History
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your scan history will appear here.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <List>
              {scanHistory.map((scan, index) => (
                <React.Fragment key={scan.id}>
                  <ListItem
                    secondaryAction={
                      <Tooltip title="Export Results">
                        <IconButton onClick={() => exportResults(scan)}>
                          <Download />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemIcon>
                      {getSeverityIcon(scan.results.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {scan.domain}
                          </Typography>
                          <Chip
                            label={`${scan.results.score}/100`}
                            size="small"
                            sx={{ backgroundColor: getSeverityColor(scan.results.severity), color: 'white' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {scan.results.summary}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(scan.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < scanHistory.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Container>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Container maxWidth="sm" sx={{ py: 2 }}>
          <Typography variant="h6" gutterBottom>
            Settings
          </Typography>
          
          {settings && (
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Mode: {settings.mode}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  API URL: {settings.apiUrl}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Real-time Monitoring: {settings.realTimeMonitoring ? 'Enabled' : 'Disabled'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Auto Scan: {settings.autoScan ? 'Enabled' : 'Disabled'}
                </Typography>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Settings />}
                  onClick={() => chrome.runtime.openOptionsPage()}
                  sx={{ mt: 2 }}
                >
                  Open Settings
                </Button>
              </CardContent>
            </Card>
          )}
        </Container>
      </TabPanel>
    </Box>
  );
};

export default AgentShieldPopup;
