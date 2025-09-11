import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

interface TestSuite {
  _id: string;
  name: string;
  description: string;
  categories: TestCategory[];
  createdBy: string;
  isPublic: boolean;
  tags: string[];
  settings: {
    timeout: number;
    parallel: boolean;
    retryCount: number;
  };
  lastExecuted?: string;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TestCategory {
  type: 'input_injection' | 'api_fuzzing' | 'agentic_workflow';
  name: string;
  description: string;
  tests: TestCase[];
  enabled: boolean;
}

interface TestCase {
  id: string;
  name: string;
  description?: string;
  config: any;
  enabled: boolean;
}

interface TestResult {
  _id: string;
  executionId: string;
  testSuiteId: string;
  executedBy: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    vulnerabilities: Vulnerability[];
  };
  tests: TestExecution[];
  error?: string;
}

interface TestExecution {
  id: string;
  name: string;
  category: string;
  status: 'passed' | 'failed' | 'skipped';
  startTime: string;
  endTime: string;
  duration: number;
  results: any;
  vulnerability?: {
    detected: boolean;
    type: string;
    severity: string;
    description: string;
    payload?: string;
  };
  error?: string;
}

interface Vulnerability {
  testId: string;
  testName: string;
  category: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  payload?: string;
}

interface TestContextType {
  testSuites: TestSuite[];
  testResults: TestResult[];
  activeExecutions: Map<string, TestResult>;
  createTestSuite: (data: Partial<TestSuite>) => Promise<TestSuite>;
  updateTestSuite: (id: string, data: Partial<TestSuite>) => Promise<TestSuite>;
  deleteTestSuite: (id: string) => Promise<void>;
  executeTestSuite: (id: string, options?: any) => Promise<string>;
  getTestResult: (executionId: string) => TestResult | undefined;
  cancelExecution: (executionId: string) => Promise<void>;
  loading: boolean;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export const TestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeExecutions] = useState<Map<string, TestResult>>(new Map());
  const queryClient = useQueryClient();

  // Fetch test suites
  const { data: testSuites = [], isLoading: testSuitesLoading } = useQuery(
    'testSuites',
    async () => {
      const response = await axios.get('/tests');
      return response.data.testSuites;
    }
  );

  // Fetch test results
  const { data: testResults = [], isLoading: resultsLoading } = useQuery(
    'testResults',
    async () => {
      const response = await axios.get('/results');
      return response.data.results;
    }
  );

  // Create test suite mutation
  const createTestSuiteMutation = useMutation(
    async (data: Partial<TestSuite>) => {
      const response = await axios.post('/tests', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testSuites');
        toast.success('Test suite created successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create test suite');
      }
    }
  );

  // Update test suite mutation
  const updateTestSuiteMutation = useMutation(
    async ({ id, data }: { id: string; data: Partial<TestSuite> }) => {
      const response = await axios.put(`/tests/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testSuites');
        toast.success('Test suite updated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update test suite');
      }
    }
  );

  // Delete test suite mutation
  const deleteTestSuiteMutation = useMutation(
    async (id: string) => {
      await axios.delete(`/tests/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testSuites');
        queryClient.invalidateQueries('testResults');
        toast.success('Test suite deleted successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete test suite');
      }
    }
  );

  // Execute test suite mutation
  const executeTestSuiteMutation = useMutation(
    async ({ id, options }: { id: string; options?: any }) => {
      const response = await axios.post(`/tests/${id}/execute`, options);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testResults');
        toast.success('Test execution started');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to start test execution');
      }
    }
  );

  // Cancel execution mutation
  const cancelExecutionMutation = useMutation(
    async (executionId: string) => {
      await axios.post(`/tests/cancel/${executionId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testResults');
        toast.success('Test execution cancelled');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to cancel execution');
      }
    }
  );

  const createTestSuite = async (data: Partial<TestSuite>) => {
    return createTestSuiteMutation.mutateAsync(data);
  };

  const updateTestSuite = async (id: string, data: Partial<TestSuite>) => {
    return updateTestSuiteMutation.mutateAsync({ id, data });
  };

  const deleteTestSuite = async (id: string) => {
    return deleteTestSuiteMutation.mutateAsync(id);
  };

  const executeTestSuite = async (id: string, options?: any) => {
    const result = await executeTestSuiteMutation.mutateAsync({ id, options });
    return result.executionId;
  };

  const getTestResult = (executionId: string): TestResult | undefined => {
    return testResults.find(result => result.executionId === executionId);
  };

  const cancelExecution = async (executionId: string) => {
    return cancelExecutionMutation.mutateAsync(executionId);
  };

  const value = {
    testSuites,
    testResults,
    activeExecutions,
    createTestSuite,
    updateTestSuite,
    deleteTestSuite,
    executeTestSuite,
    getTestResult,
    cancelExecution,
    loading: testSuitesLoading || resultsLoading
  };

  return (
    <TestContext.Provider value={value}>
      {children}
    </TestContext.Provider>
  );
};

export const useTest = () => {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error('useTest must be used within a TestProvider');
  }
  return context;
};
