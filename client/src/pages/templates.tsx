import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  ExpandMore,
  Security,
  BugReport,
  Assessment,
  Add,
  PlayArrow
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useTest } from '@/contexts/TestContext';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Templates() {
  const { user } = useAuth();
  const { createTestSuite } = useTest();
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [customConfig, setCustomConfig] = useState<any>({});

  // Fetch test templates
  const { data: templates, isLoading } = useQuery(
    'testTemplates',
    async () => {
      const response = await axios.get('/config/test-templates');
      return response.data;
    }
  );

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleUseTemplate = (template: any, category: string) => {
    setSelectedTemplate({ ...template, category });
    setCustomConfig(template.config);
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const testSuite = {
        name: `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
        description: `Created from template: ${selectedTemplate.name}`,
        categories: [{
          type: selectedTemplate.category,
          name: selectedTemplate.name,
          description: selectedTemplate.description,
          tests: [{
            id: `test_${Date.now()}`,
            name: selectedTemplate.name,
            description: selectedTemplate.description,
            config: customConfig,
            enabled: true
          }],
          enabled: true
        }],
        tags: ['template', selectedTemplate.category],
        settings: {
          timeout: 10000,
          parallel: false,
          retryCount: 0
        }
      };

      await createTestSuite(testSuite);
      setSelectedTemplate(null);
      setCustomConfig({});
    } catch (error) {
      toast.error('Failed to create test suite from template');
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'input_injection': return '#ef4444';
      case 'api_fuzzing': return '#3b82f6';
      case 'agentic_workflow': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading templates...</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Test Templates
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Use pre-built templates to quickly create test suites for common security testing scenarios.
        </Typography>

        {templates && Object.entries(templates).map(([category, categoryTemplates]: [string, any]) => (
          <Box key={category} sx={{ mb: 4 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              {getCategoryIcon(category)}
              <Typography variant="h5" sx={{ textTransform: 'capitalize' }}>
                {category.replace('_', ' ')} Templates
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {categoryTemplates.map((template: any, index: number) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Chip
                          icon={getCategoryIcon(category)}
                          label={category.replace('_', ' ').toUpperCase()}
                          size="small"
                          sx={{
                            backgroundColor: getCategoryColor(category),
                            color: 'white',
                            '& .MuiChip-icon': {
                              color: 'white'
                            }
                          }}
                        />
                      </Box>

                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {template.description}
                      </Typography>

                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="body2">View Configuration</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              <strong>Target URL:</strong> {template.config.targetUrl}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Payloads:</strong> {template.config.payloads?.length || 0} test cases
                            </Typography>
                            {template.config.method && (
                              <Typography variant="body2" gutterBottom>
                                <strong>Method:</strong> {template.config.method}
                              </Typography>
                            )}
                            {template.config.workflowSteps && (
                              <Typography variant="body2" gutterBottom>
                                <strong>Workflow Steps:</strong> {template.config.workflowSteps.length}
                              </Typography>
                            )}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </CardContent>

                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleUseTemplate(template, category)}
                      >
                        Use Template
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

        {/* Template Configuration Dialog */}
        {selectedTemplate && (
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configure Template: {selectedTemplate.name}
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Customize the template configuration before creating your test suite.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Target URL"
                    value={customConfig.targetUrl || ''}
                    onChange={(e) => setCustomConfig({
                      ...customConfig,
                      targetUrl: e.target.value
                    })}
                    helperText="The URL endpoint to test"
                  />
                </Grid>

                {selectedTemplate.category === 'api_fuzzing' && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>HTTP Method</InputLabel>
                      <Select
                        value={customConfig.method || 'POST'}
                        onChange={(e) => setCustomConfig({
                          ...customConfig,
                          method: e.target.value
                        })}
                      >
                        <MenuItem value="GET">GET</MenuItem>
                        <MenuItem value="POST">POST</MenuItem>
                        <MenuItem value="PUT">PUT</MenuItem>
                        <MenuItem value="DELETE">DELETE</MenuItem>
                        <MenuItem value="PATCH">PATCH</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Additional Headers (JSON)"
                    value={customConfig.headers ? JSON.stringify(customConfig.headers, null, 2) : '{}'}
                    onChange={(e) => {
                      try {
                        const headers = JSON.parse(e.target.value);
                        setCustomConfig({
                          ...customConfig,
                          headers
                        });
                      } catch (error) {
                        // Invalid JSON, keep the text for now
                      }
                    }}
                    helperText="Enter headers as JSON object"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={handleCreateFromTemplate}
                    >
                      Create Test Suite
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSelectedTemplate(null);
                        setCustomConfig({});
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
    </Layout>
  );
}
