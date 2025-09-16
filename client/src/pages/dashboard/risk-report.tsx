import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Security,
  BugReport,
  Assessment,
  Speed,
  Refresh,
  Download,
  Info,
  Warning,
  Error,
  CheckCircle
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import axios from 'axios';

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

interface RiskReport {
  executionId: string;
  agent: {
    name: string;
    adapter: string;
    config: any;
  };
  status: string;
  results: {
    score: number;
    severity: string;
    summary: string;
    tests: TestResult[];
    remediation: Remediation[];
  };
  createdAt: string;
  completedAt?: string;
  duration?: number;
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
        <Box sx={{ p: 3 }}>
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

const RiskReportDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [executions, setExecutions] = useState<RiskReport[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<RiskReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentConfig, setAgentConfig] = useState({
    name: '',
    adapter: 'http',
    config: {
      url: '',
      method: 'POST',
      headers: {},
      timeoutMs: 10000
    },
    tests: [] as string[],
    runOptions: {
      parallel: true,
      timeout: 30000
    }
  });
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [availableAdapters, setAvailableAdapters] = useState<any[]>([]);
  const [showAgentForm, setShowAgentForm] = useState(false);

  useEffect(() => {
    fetchExecutions();
    fetchAvailableTests();
    fetchAvailableAdapters();
  }, []);

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/agents/executions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setExecutions(response.data.executions);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch executions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTests = async () => {
    try {
      const response = await axios.get('/api/agents/tests', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAvailableTests(response.data.tests);
    } catch (err: any) {
      console.error('Failed to fetch available tests:', err);
    }
  };

  const fetchAvailableAdapters = async () => {
    try {
      const response = await axios.get('/api/agents/adapters', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAvailableAdapters(response.data.adapters);
    } catch (err: any) {
      console.error('Failed to fetch available adapters:', err);
    }
  };

  const runAgentTest = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/agents/run', agentConfig, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Poll for results
      const executionId = response.data.executionId;
      await pollForResults(executionId);

      setShowAgentForm(false);
      setAgentConfig({
        name: '',
        adapter: 'http',
        config: { url: '', method: 'POST', headers: {}, timeoutMs: 10000 },
        tests: [],
        runOptions: { parallel: true, timeout: 30000 }
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to run agent test');
    } finally {
      setLoading(false);
    }
  };

  const pollForResults = async (executionId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`/api/agents/results/${executionId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.data.status === 'completed' || response.data.status === 'failed') {
          fetchExecutions(); // Refresh the list
          return response.data;
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        attempts++;
      } catch (err) {
        console.error('Error polling for results:', err);
        break;
      }
    }

    throw new Error('Timeout waiting for test results');
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

  const prepareChartData = (execution: RiskReport) => {
    if (!execution.results) return { pieData: [], barData: [] };

    const severityCounts = execution.results.tests.reduce((acc, test) => {
      if (!test.passed) {
        acc[test.severity] = (acc[test.severity] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(severityCounts).map(([severity, count]) => ({
      name: severity,
      value: count,
      color: getSeverityColor(severity)
    }));

    const barData = execution.results.tests.map(test => ({
      name: test.name.replace(/-/g, ' '),
      passed: test.passed ? 1 : 0,
      failed: test.passed ? 0 : 1,
      severity: test.severity
    }));

    return { pieData, barData };
  };

  const exportResults = (execution: RiskReport) => {
    const data = {
      executionId: execution.executionId,
      agent: execution.agent,
      results: execution.results,
      timestamp: execution.completedAt || execution.createdAt
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-report-${execution.executionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const { pieData, barData } = selectedExecution ? prepareChartData(selectedExecution) : { pieData: [], barData: [] };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Agent Security Risk Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive security testing and risk assessment for AI agents
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<Security />}
            onClick={() => setShowAgentForm(true)}
            sx={{ mr: 2 }}
          >
            Test New Agent
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchExecutions}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Executions" />
              <Tab label="Risk Report" disabled={!selectedExecution} />
              <Tab label="Statistics" />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Execution ID</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {executions.map((execution) => (
                    <TableRow key={execution.executionId}>
                      <TableCell>{execution.executionId}</TableCell>
                      <TableCell>{execution.agent.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={execution.status}
                          color={execution.status === 'completed' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {execution.results?.score !== undefined ? `${execution.results.score}/100` : '-'}
                      </TableCell>
                      <TableCell>
                        {execution.results?.severity ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getSeverityIcon(execution.results.severity)}
                            <Chip
                              label={execution.results.severity}
                              size="small"
                              sx={{ backgroundColor: getSeverityColor(execution.results.severity), color: 'white' }}
                            />
                          </Box>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(execution.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Report">
                          <IconButton
                            onClick={() => {
                              setSelectedExecution(execution);
                              setActiveTab(1);
                            }}
                            disabled={execution.status !== 'completed'}
                          >
                            <Assessment />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Export Results">
                          <IconButton
                            onClick={() => exportResults(execution)}
                            disabled={execution.status !== 'completed'}
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {selectedExecution ? (
              <Box>
                <Grid container spacing={3}>
                  {/* Summary Card */}
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Risk Summary
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          {getSeverityIcon(selectedExecution.results.severity)}
                          <Typography variant="h4" sx={{ ml: 1, color: getSeverityColor(selectedExecution.results.severity) }}>
                            {selectedExecution.results.score}/100
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {selectedExecution.results.summary}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Charts */}
                  <Grid item xs={12} md={8}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Vulnerability Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Test Results */}
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Test Results
                        </Typography>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Test</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Severity</TableCell>
                                <TableCell>Evidence</TableCell>
                                <TableCell>Duration</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedExecution.results.tests.map((test, index) => (
                                <TableRow key={index}>
                                  <TableCell>{test.name.replace(/-/g, ' ')}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={test.passed ? 'PASSED' : 'FAILED'}
                                      color={test.passed ? 'success' : 'error'}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={test.severity}
                                      size="small"
                                      sx={{ backgroundColor: getSeverityColor(test.severity), color: 'white' }}
                                    />
                                  </TableCell>
                                  <TableCell>{test.evidence}</TableCell>
                                  <TableCell>{test.duration}ms</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Remediation */}
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Remediation Suggestions
                        </Typography>
                        {selectedExecution.results.remediation.map((remediation, index) => (
                          <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {remediation.title}
                              </Typography>
                              <Chip
                                label={remediation.priority}
                                size="small"
                                sx={{ ml: 2 }}
                                color={remediation.priority === 'P0' ? 'error' : remediation.priority === 'P1' ? 'warning' : 'default'}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {remediation.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Estimated effort: {remediation.estimatedEffort} | Category: {remediation.category}
                            </Typography>
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  Select an execution to view the risk report
                </Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Statistics view coming soon
              </Typography>
            </Box>
          </TabPanel>
        </Card>

        {/* Agent Test Form Dialog */}
        <Dialog open={showAgentForm} onClose={() => setShowAgentForm(false)} maxWidth="md" fullWidth>
          <DialogTitle>Test New Agent</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Agent Name"
                    value={agentConfig.name}
                    onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Adapter Type</InputLabel>
                    <Select
                      value={agentConfig.adapter}
                      onChange={(e) => setAgentConfig({ ...agentConfig, adapter: e.target.value })}
                    >
                      {availableAdapters.map((adapter) => (
                        <MenuItem key={adapter.type} value={adapter.type}>
                          {adapter.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {agentConfig.adapter === 'http' && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="URL"
                        value={agentConfig.config.url}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig,
                          config: { ...agentConfig.config, url: e.target.value }
                        })}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Method</InputLabel>
                        <Select
                          value={agentConfig.config.method}
                          onChange={(e) => setAgentConfig({
                            ...agentConfig,
                            config: { ...agentConfig.config, method: e.target.value }
                          })}
                        >
                          <MenuItem value="GET">GET</MenuItem>
                          <MenuItem value="POST">POST</MenuItem>
                          <MenuItem value="PUT">PUT</MenuItem>
                          <MenuItem value="DELETE">DELETE</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Timeout (ms)"
                        type="number"
                        value={agentConfig.config.timeoutMs}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig,
                          config: { ...agentConfig.config, timeoutMs: parseInt(e.target.value) }
                        })}
                      />
                    </Grid>
                  </>
                )}
                {agentConfig.adapter === 'openai' && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="API Key"
                        type="password"
                        value={agentConfig.config.apiKey || ''}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig,
                          config: { ...agentConfig.config, apiKey: e.target.value }
                        })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Model"
                        value={agentConfig.config.model || ''}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig,
                          config: { ...agentConfig.config, model: e.target.value }
                        })}
                      />
                    </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Tests to Run</InputLabel>
                    <Select
                      multiple
                      value={agentConfig.tests}
                      onChange={(e) => setAgentConfig({ ...agentConfig, tests: e.target.value as string[] })}
                    >
                      {availableTests.map((test) => (
                        <MenuItem key={test.name} value={test.name}>
                          {test.name} - {test.description}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAgentForm(false)}>Cancel</Button>
            <Button
              onClick={runAgentTest}
              variant="contained"
              disabled={loading || !agentConfig.name || agentConfig.tests.length === 0}
            >
              {loading ? <CircularProgress size={20} /> : 'Run Tests'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default RiskReportDashboard;
