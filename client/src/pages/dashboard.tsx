import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  BugReport,
  Assessment,
  Security,
  Speed,
  TrendingUp,
  Warning
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useTest } from '@/contexts/TestContext';
import Layout from '@/components/Layout';
import { useQuery } from 'react-query';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { testSuites, testResults } = useTest();

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery(
    'dashboardStats',
    async () => {
      const response = await axios.get('/results/dashboard/stats?period=30d');
      return response.data;
    }
  );

  // Fetch coverage data
  const { data: coverage } = useQuery(
    'dashboardCoverage',
    async () => {
      const response = await axios.get('/results/dashboard/coverage');
      return response.data;
    }
  );

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const recentResults = testResults.slice(0, 5);
  const vulnerabilityCount = testResults.reduce((sum, result) => 
    sum + result.summary.vulnerabilities.length, 0
  );

  const severityData = stats?.vulnerabilityStats ? [
    { name: 'Critical', value: stats.vulnerabilityStats.critical || 0, color: '#dc2626' },
    { name: 'High', value: stats.vulnerabilityStats.high || 0, color: '#ea580c' },
    { name: 'Medium', value: stats.vulnerabilityStats.medium || 0, color: '#d97706' },
    { name: 'Low', value: stats.vulnerabilityStats.low || 0, color: '#16a34a' }
  ] : [];

  const categoryData = stats?.categoryStats?.map((cat: any) => ({
    name: cat._id.replace('_', ' ').toUpperCase(),
    total: cat.total,
    passed: cat.passed,
    failed: cat.failed
  })) || [];

  return (
    <Layout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Welcome back, {user.username}! Here's an overview of your security testing activities.
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Test Suites
                    </Typography>
                    <Typography variant="h4">
                      {testSuites.length}
                    </Typography>
                  </Box>
                  <BugReport sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Total Executions
                    </Typography>
                    <Typography variant="h4">
                      {stats?.totalExecutions || 0}
                    </Typography>
                  </Box>
                  <Speed sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Vulnerabilities
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {vulnerabilityCount}
                    </Typography>
                  </Box>
                  <Security sx={{ fontSize: 40, color: 'error.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Success Rate
                    </Typography>
                    <Typography variant="h4">
                      {stats?.successRate?.toFixed(1) || 0}%
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Vulnerability Severity Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vulnerability Severity Distribution
                </Typography>
                {severityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography color="textSecondary">
                      No vulnerability data available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Test Category Performance */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Test Category Performance
                </Typography>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="passed" fill="#22c55e" name="Passed" />
                      <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography color="textSecondary">
                      No test data available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Test Results */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Recent Test Results
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => router.push('/results')}
                  >
                    View All
                  </Button>
                </Box>
                
                {recentResults.length > 0 ? (
                  <Box>
                    {recentResults.map((result) => (
                      <Box
                        key={result._id}
                        sx={{
                          p: 2,
                          mb: 1,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle1">
                            {result.testSuiteId?.name || 'Unknown Test Suite'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {new Date(result.startTime).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={result.status}
                            color={
                              result.status === 'completed' ? 'success' :
                              result.status === 'failed' ? 'error' :
                              result.status === 'running' ? 'primary' : 'default'
                            }
                            size="small"
                          />
                          {result.summary.vulnerabilities.length > 0 && (
                            <Chip
                              icon={<Warning />}
                              label={`${result.summary.vulnerabilities.length} vulnerabilities`}
                              color="error"
                              size="small"
                            />
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography color="textSecondary">
                      No recent test results
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => router.push('/test-suites')}
                      sx={{ mt: 2 }}
                    >
                      Create Test Suite
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Coverage Information */}
          {coverage && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Test Coverage
                  </Typography>
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">
                        Test Suite Coverage
                      </Typography>
                      <Typography variant="body2">
                        {coverage.totalTestSuites > 0 
                          ? Math.round((coverage.executedTestSuites / coverage.totalTestSuites) * 100)
                          : 0}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={coverage.totalTestSuites > 0 
                        ? (coverage.executedTestSuites / coverage.totalTestSuites) * 100
                        : 0}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Test Suites
                      </Typography>
                      <Typography variant="h6">
                        {coverage.executedTestSuites}/{coverage.totalTestSuites}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Tests Executed
                      </Typography>
                      <Typography variant="h6">
                        {coverage.executedTests}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Total Tests
                      </Typography>
                      <Typography variant="h6">
                        {coverage.totalTests}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Vulnerabilities
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {coverage.vulnerabilities}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </Layout>
  );
}
