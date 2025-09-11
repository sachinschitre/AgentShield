import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Alert
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  PlayArrow,
  BugReport,
  Security,
  Assessment,
  Speed
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useTest } from '@/contexts/TestContext';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';

interface TestSuiteForm {
  name: string;
  description: string;
  categories: Array<{
    type: 'input_injection' | 'api_fuzzing' | 'agentic_workflow';
    name: string;
    description: string;
    tests: Array<{
      id: string;
      name: string;
      description: string;
      config: any;
      enabled: boolean;
    }>;
    enabled: boolean;
  }>;
  tags: string[];
  settings: {
    timeout: number;
    parallel: boolean;
    retryCount: number;
  };
}

const categoryTypes = [
  { value: 'input_injection', label: 'Input Injection Testing', icon: <Security /> },
  { value: 'api_fuzzing', label: 'API Fuzzing', icon: <BugReport /> },
  { value: 'agentic_workflow', label: 'Agentic Workflow Testing', icon: <Assessment /> }
];

export default function TestSuites() {
  const { user } = useAuth();
  const { testSuites, createTestSuite, updateTestSuite, deleteTestSuite, executeTestSuite } = useTest();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSuite, setSelectedSuite] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<TestSuiteForm>({
    defaultValues: {
      name: '',
      description: '',
      categories: [],
      tags: [],
      settings: {
        timeout: 10000,
        parallel: false,
        retryCount: 0
      }
    }
  });

  const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({
    control,
    name: 'categories'
  });

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, suite: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedSuite(suite);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSuite(null);
  };

  const handleCreateNew = () => {
    reset();
    setIsEditing(false);
    setOpenDialog(true);
  };

  const handleEdit = (suite: any) => {
    reset(suite);
    setIsEditing(true);
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedSuite) {
      try {
        await deleteTestSuite(selectedSuite._id);
        toast.success('Test suite deleted successfully');
      } catch (error) {
        toast.error('Failed to delete test suite');
      }
    }
    handleMenuClose();
  };

  const handleExecute = async (suite: any) => {
    try {
      const executionId = await executeTestSuite(suite._id);
      router.push(`/results?executionId=${executionId}`);
    } catch (error) {
      toast.error('Failed to start test execution');
    }
  };

  const onSubmit = async (data: TestSuiteForm) => {
    try {
      if (isEditing && selectedSuite) {
        await updateTestSuite(selectedSuite._id, data);
      } else {
        await createTestSuite(data);
      }
      setOpenDialog(false);
      reset();
    } catch (error) {
      toast.error('Failed to save test suite');
    }
  };

  const getCategoryIcon = (type: string) => {
    const category = categoryTypes.find(cat => cat.value === type);
    return category?.icon || <BugReport />;
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'input_injection': return '#ef4444';
      case 'api_fuzzing': return '#3b82f6';
      case 'agentic_workflow': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <Layout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            Test Suites
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateNew}
          >
            Create Test Suite
          </Button>
        </Box>

        {testSuites.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Speed sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No Test Suites Yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Create your first test suite to start testing your AI applications for security vulnerabilities.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateNew}
                size="large"
              >
                Create Your First Test Suite
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {testSuites.map((suite) => (
              <Grid item xs={12} md={6} lg={4} key={suite._id}>
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
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {suite.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, suite)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {suite.description || 'No description provided'}
                    </Typography>

                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {suite.categories.map((category, index) => (
                        <Chip
                          key={index}
                          icon={getCategoryIcon(category.type)}
                          label={category.name}
                          size="small"
                          sx={{
                            backgroundColor: getCategoryColor(category.type),
                            color: 'white',
                            '& .MuiChip-icon': {
                              color: 'white'
                            }
                          }}
                        />
                      ))}
                    </Box>

                    {suite.tags.length > 0 && (
                      <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                        {suite.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    )}

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        {suite.executionCount} executions
                      </Typography>
                      {suite.lastExecuted && (
                        <Typography variant="body2" color="text.secondary">
                          Last run: {new Date(suite.lastExecuted).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleEdit(suite)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<PlayArrow />}
                      onClick={() => handleExecute(suite)}
                      color="primary"
                    >
                      Run
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleEdit(selectedSuite)}>
            <Edit sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => handleExecute(selectedSuite)}>
            <PlayArrow sx={{ mr: 1 }} />
            Run
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Create/Edit Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogTitle>
              {isEditing ? 'Edit Test Suite' : 'Create Test Suite'}
            </DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Name"
                fullWidth
                variant="outlined"
                {...register('name', { required: 'Name is required' })}
                error={!!errors.name}
                helperText={errors.name?.message}
                sx={{ mb: 2 }}
              />
              
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                {...register('description')}
                sx={{ mb: 2 }}
              />

              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Test Categories
                </Typography>
                {categoryFields.map((field, index) => (
                  <Card key={field.id} sx={{ mb: 2, p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Category {index + 1}
                      </Typography>
                      <Button
                        color="error"
                        onClick={() => removeCategory(index)}
                      >
                        Remove
                      </Button>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Category Type</InputLabel>
                          <Select
                            {...register(`categories.${index}.type`)}
                            input={<OutlinedInput label="Category Type" />}
                          >
                            {categoryTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                <Box display="flex" alignItems="center">
                                  {type.icon}
                                  <Box ml={1}>{type.label}</Box>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Category Name"
                          fullWidth
                          {...register(`categories.${index}.name`)}
                        />
                      </Grid>
                    </Grid>
                  </Card>
                ))}
                
                <Button
                  variant="outlined"
                  onClick={() => appendCategory({
                    type: 'input_injection',
                    name: '',
                    description: '',
                    tests: [],
                    enabled: true
                  })}
                >
                  Add Category
                </Button>
              </Box>

              <TextField
                margin="dense"
                label="Tags (comma-separated)"
                fullWidth
                variant="outlined"
                {...register('tags')}
                helperText="Enter tags separated by commas"
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle1" gutterBottom>
                Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Timeout (ms)"
                    type="number"
                    fullWidth
                    {...register('settings.timeout', { valueAsNumber: true })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Retry Count</InputLabel>
                    <Select
                      {...register('settings.retryCount', { valueAsNumber: true })}
                      input={<OutlinedInput label="Retry Count" />}
                    >
                      <MenuItem value={0}>0</MenuItem>
                      <MenuItem value={1}>1</MenuItem>
                      <MenuItem value={2}>2</MenuItem>
                      <MenuItem value={3}>3</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained">
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Layout>
  );
}
