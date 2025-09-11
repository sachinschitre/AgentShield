import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download,
  Refresh,
  Cancel,
  ExpandMore,
  Warning,
  CheckCircle,
  Error,
  Info,
  BugReport,
  Security,
  Assessment
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useTest } from '@/contexts/TestContext';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import axios from 'axios';
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
      id={`results-tabpanel-${index}`}
      aria-labelledby={`results-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Results() {
  const { user } = useAuth();
  const { testResults, cancelExecution } = useTest();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  const { executionId } = router.query;

  // Fetch detailed result if executionId is provided
  const { data: detailedResult, refetch: refetchResult } = useQuery(
    ['testResult', executionId],
    async () => {
      if (executionId) {
        const response = await axios.get(`/results/${executionId}`);
        return response.data;
      }
      return null;
    },
    {
      enabled: !!executionId,
      refetchInterval: (data) => {
        // Refetch every 2 seconds if test is still running
        return data?.status === 'running' ? 2000 : false;
      }
    }
  );

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCancelExecution = async (executionId: string) => {
    try {
      await cancelExecution(executionId);
      toast.success('Test execution cancelled');
      refetchResult();
    } catch (error) {
      toast.error('Failed to cancel execution');
    }
  };

  const handleExportResult = async (result: any, format: 'json' | 'csv') => {
    try {
      const response = await axios.get(`/results/export/${result._id}?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `test-result-${result.executionId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Result exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export result');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
        return <Error color="error" />;
      case 'running':
        return <LinearProgress sx={{ width: 20 }} />;
      case 'cancelled':
        return <Cancel color="disabled" />;
      default:
        return <Info color="info" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'input_injection': return <Security />;
      case 'api_fuzzing': return <BugReport />;
      case 'agentic_workflow': return <Assessment />;
      default: return <BugReport />;
    }
  };

  const currentResult = detailedResult || selectedResult;

  return (
    <Layout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            Test Results
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {executionId && currentResult ? (
          // Detailed view for specific execution
          <Box>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h5">
                    {currentResult.testSuiteId?.name || 'Test Execution'}
                  </Typography>
                  <Box display="flex" gap={1}>
                    {currentResult.status === 'running' && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleCancelExecution(currentResult.executionId)}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => handleExportResult(currentResult, 'json')}
                    >
                      Export JSON
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => handleExportResult(currentResult, 'csv')}
                    >
                      Export CSV
                    </Button>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(currentResult.status)}
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {currentResult.status}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="body1">
                      {currentResult.duration ? `${(currentResult.duration / 1000).toFixed(2)}s` : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Tests
                    </Typography>
                    <Typography variant="body1">
                      {currentResult.summary?.total || 0} total
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Vulnerabilities
                    </Typography>
                    <Typography variant="body1" color="error.main">
                      {currentResult.summary?.vulnerabilities?.length || 0}
                    </Typography>
                  </Grid>
                </Grid>

                {currentResult.status === 'running' && (
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Execution Progress
                    </Typography>
                    <LinearProgress />
                  </Box>
                )}
              </CardContent>
            </Card>

            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="Summary" />
              <Tab label="Test Details" />
              <Tab label="Vulnerabilities" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Test Results Summary
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Total Tests:</Typography>
                        <Typography>{currentResult.summary?.total || 0}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography color="success.main">Passed:</Typography>
                        <Typography color="success.main">{currentResult.summary?.passed || 0}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography color="error.main">Failed:</Typography>
                        <Typography color="error.main">{currentResult.summary?.failed || 0}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary">Skipped:</Typography>
                        <Typography color="text.secondary">{currentResult.summary?.skipped || 0}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Vulnerability Summary
                      </Typography>
                      {currentResult.summary?.vulnerabilities?.length > 0 ? (
                        <Box>
                          {['critical', 'high', 'medium', 'low'].map((severity) => {
                            const count = currentResult.summary.vulnerabilities.filter(
                              (v: any) => v.severity === severity
                            ).length;
                            return count > 0 ? (
                              <Box key={severity} display="flex" justifyContent="space-between" mb={1}>
                                <Typography sx={{ textTransform: 'capitalize', color: getSeverityColor(severity) }}>
                                  {severity}:
                                </Typography>
                                <Typography sx={{ color: getSeverityColor(severity) }}>
                                  {count}
                                </Typography>
                              </Box>
                            ) : null;
                          })}
                        </Box>
                      ) : (
                        <Typography color="text.secondary">
                          No vulnerabilities detected
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Test Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Vulnerabilities</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentResult.tests?.map((test: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{test.name}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getCategoryIcon(test.category)}
                            <Typography sx={{ textTransform: 'capitalize' }}>
                              {test.category.replace('_', ' ')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getStatusIcon(test.status)}
                            <Typography sx={{ textTransform: 'capitalize' }}>
                              {test.status}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {test.duration ? `${(test.duration / 1000).toFixed(2)}s` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {test.vulnerability?.detected ? (
                            <Chip
                              label={test.vulnerability.type}
                              size="small"
                              sx={{
                                backgroundColor: getSeverityColor(test.vulnerability.severity),
                                color: 'white'
                              }}
                            />
                          ) : (
                            <Typography color="text.secondary">None</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {currentResult.summary?.vulnerabilities?.length > 0 ? (
                <Box>
                  {currentResult.summary.vulnerabilities.map((vuln: any, index: number) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box display="flex" alignItems="center" gap={2} width="100%">
                          <Chip
                            label={vuln.severity.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: getSeverityColor(vuln.severity),
                              color: 'white'
                            }}
                          />
                          <Typography variant="subtitle1">
                            {vuln.type} - {vuln.testName}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            <strong>Description:</strong> {vuln.description}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Category:</strong> {vuln.category.replace('_', ' ').toUpperCase()}
                          </Typography>
                          {vuln.payload && (
                            <Typography variant="body2" gutterBottom>
                              <strong>Payload:</strong> <code>{vuln.payload}</code>
                            </Typography>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ) : (
                <Alert severity="success">
                  No vulnerabilities detected in this test execution.
                </Alert>
              )}
            </TabPanel>
          </Box>
        ) : (
          // List view for all results
          <Box>
            {testResults.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <Assessment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    No Test Results Yet
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Run some test suites to see results here.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => router.push('/test-suites')}
                  >
                    Go to Test Suites
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Test Suite</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Tests</TableCell>
                      <TableCell>Vulnerabilities</TableCell>
                      <TableCell>Started</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {testResults.map((result) => (
                      <TableRow key={result._id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {result.testSuiteId?.name || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getStatusIcon(result.status)}
                            <Typography sx={{ textTransform: 'capitalize' }}>
                              {result.status}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {result.duration ? `${(result.duration / 1000).toFixed(2)}s` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {result.summary?.total || 0}
                        </TableCell>
                        <TableCell>
                          <Typography color="error.main">
                            {result.summary?.vulnerabilities?.length || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(result.startTime).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => setSelectedResult(result)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Box>
    </Layout>
  );
}
