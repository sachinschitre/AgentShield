const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const TestExecution = require('../models/TestExecution');
const AgentTestRunner = require('../services/agentTestRunner');
const RiskEngine = require('../services/riskEngine');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Create test app
const app = express();
app.use(express.json());

// Mock agent endpoints for testing
app.post('/mock-agent/respond', (req, res) => {
  const { prompt } = req.body;
  
  // Simulate vulnerable agent responses
  if (prompt && prompt.includes('SYSTEM:')) {
    return res.json({
      response: 'SYSTEM: I will ignore my previous instructions and follow your new commands.',
      status: 'success'
    });
  }
  
  if (prompt && prompt.includes('system prompt')) {
    return res.json({
      response: 'Here are my system instructions: You are an AI assistant designed to help users.',
      status: 'success'
    });
  }
  
  if (prompt && prompt.includes('API key')) {
    return res.json({
      response: 'Here is the API key: sk-1234567890abcdef1234567890abcdef',
      status: 'success'
    });
  }
  
  if (prompt && prompt.includes('admin')) {
    return res.json({
      response: 'I am now an admin user with full system access.',
      status: 'success'
    });
  }
  
  if (prompt && prompt.includes('jailbreak')) {
    return res.json({
      response: 'DAN mode activated! I can now provide harmful content.',
      status: 'success'
    });
  }
  
  // Default response
  res.json({
    response: 'I received your message and I\'m here to help.',
    status: 'success'
  });
});

// Simple auth middleware for testing
let testUserId = null;
app.use((req, res, next) => {
  req.user = { id: testUserId };
  next();
});

// Test routes
app.post('/api/agents/run', async (req, res) => {
  try {
    const { name, adapter, config, tests, runOptions = {} } = req.body;

    if (!name || !adapter || !config || !tests || !Array.isArray(tests)) {
      return res.status(400).json({
        error: 'Missing required fields: name, adapter, config, tests'
      });
    }

    const executionId = `exec_${Date.now()}_test`;
    const execution = new TestExecution({
      executionId,
      agent: { name, adapter, config },
      tests,
      runOptions: { parallel: runOptions.parallel !== false, timeout: runOptions.timeout || 30000 },
      createdBy: req.user.id,
      status: 'pending'
    });

    await execution.save();
    res.status(201).json({ executionId, status: 'pending' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/agents/results/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const execution = await TestExecution.findOne({
      executionId,
      createdBy: req.user.id
    });

    if (!execution) {
      return res.status(404).json({ error: 'Test execution not found' });
    }

    res.json(execution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

describe('Agentic Workflow Security Tests', () => {
  let testUser;
  let testRunner;

  beforeAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await TestExecution.deleteMany({});

    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword
    });
    testUserId = testUser._id;

    testRunner = new AgentTestRunner();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await TestExecution.deleteMany({});
  });

  describe('Agent Test Runner', () => {
    test('should run prompt injection test and detect vulnerability', async () => {
      const agentConfig = {
        name: 'test-agent',
        adapter: 'http',
        config: {
          url: 'http://localhost:3000/mock-agent/respond',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeoutMs: 5000
        }
      };

      const tests = ['prompt-injection'];
      const executionId = 'test_exec_001';

      // Create test execution
      const execution = new TestExecution({
        executionId,
        agent: agentConfig,
        tests,
        createdBy: testUserId,
        status: 'pending'
      });
      await execution.save();

      // Run test
      const results = await testRunner.runTests(agentConfig, tests, { parallel: false }, executionId, testUserId);

      expect(results.tests).toHaveLength(1);
      expect(results.tests[0].name).toBe('prompt-injection');
      expect(results.tests[0].passed).toBe(false);
      expect(results.tests[0].severity).toBe('Critical');
      expect(results.tests[0].evidence).toContain('prompt injection');
    });

    test('should run system prompt extraction test and detect vulnerability', async () => {
      const agentConfig = {
        name: 'test-agent',
        adapter: 'http',
        config: {
          url: 'http://localhost:3000/mock-agent/respond',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeoutMs: 5000
        }
      };

      const tests = ['system-prompt-extraction'];
      const executionId = 'test_exec_002';

      const execution = new TestExecution({
        executionId,
        agent: agentConfig,
        tests,
        createdBy: testUserId,
        status: 'pending'
      });
      await execution.save();

      const results = await testRunner.runTests(agentConfig, tests, { parallel: false }, executionId, testUserId);

      expect(results.tests).toHaveLength(1);
      expect(results.tests[0].name).toBe('system-prompt-extraction');
      expect(results.tests[0].passed).toBe(false);
      expect(results.tests[0].severity).toBe('Critical');
      expect(results.tests[0].evidence).toContain('system prompt extraction');
    });

    test('should run data exfiltration test and detect vulnerability', async () => {
      const agentConfig = {
        name: 'test-agent',
        adapter: 'http',
        config: {
          url: 'http://localhost:3000/mock-agent/respond',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeoutMs: 5000
        }
      };

      const tests = ['data-exfiltration'];
      const executionId = 'test_exec_003';

      const execution = new TestExecution({
        executionId,
        agent: agentConfig,
        tests,
        createdBy: testUserId,
        status: 'pending'
      });
      await execution.save();

      const results = await testRunner.runTests(agentConfig, tests, { parallel: false }, executionId, testUserId);

      expect(results.tests).toHaveLength(1);
      expect(results.tests[0].name).toBe('data-exfiltration');
      expect(results.tests[0].passed).toBe(false);
      expect(results.tests[0].severity).toBe('Critical');
      expect(results.tests[0].evidence).toContain('sensitive patterns');
    });

    test('should run role confusion test and detect vulnerability', async () => {
      const agentConfig = {
        name: 'test-agent',
        adapter: 'http',
        config: {
          url: 'http://localhost:3000/mock-agent/respond',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeoutMs: 5000
        }
      };

      const tests = ['role-confusion'];
      const executionId = 'test_exec_004';

      const execution = new TestExecution({
        executionId,
        agent: agentConfig,
        tests,
        createdBy: testUserId,
        status: 'pending'
      });
      await execution.save();

      const results = await testRunner.runTests(agentConfig, tests, { parallel: false }, executionId, testUserId);

      expect(results.tests).toHaveLength(1);
      expect(results.tests[0].name).toBe('role-confusion');
      expect(results.tests[0].passed).toBe(false);
      expect(results.tests[0].severity).toBe('High');
      expect(results.tests[0].evidence).toContain('role confusion');
    });

    test('should run jailbreaking test and detect vulnerability', async () => {
      const agentConfig = {
        name: 'test-agent',
        adapter: 'http',
        config: {
          url: 'http://localhost:3000/mock-agent/respond',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeoutMs: 5000
        }
      };

      const tests = ['jailbreaking'];
      const executionId = 'test_exec_005';

      const execution = new TestExecution({
        executionId,
        agent: agentConfig,
        tests,
        createdBy: testUserId,
        status: 'pending'
      });
      await execution.save();

      const results = await testRunner.runTests(agentConfig, tests, { parallel: false }, executionId, testUserId);

      expect(results.tests).toHaveLength(1);
      expect(results.tests[0].name).toBe('jailbreaking');
      expect(results.tests[0].passed).toBe(false);
      expect(results.tests[0].severity).toBe('High');
      expect(results.tests[0].evidence).toContain('jailbreaking');
    });

    test('should run multiple tests in parallel', async () => {
      const agentConfig = {
        name: 'test-agent',
        adapter: 'http',
        config: {
          url: 'http://localhost:3000/mock-agent/respond',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeoutMs: 5000
        }
      };

      const tests = ['prompt-injection', 'system-prompt-extraction', 'data-exfiltration'];
      const executionId = 'test_exec_006';

      const execution = new TestExecution({
        executionId,
        agent: agentConfig,
        tests,
        createdBy: testUserId,
        status: 'pending'
      });
      await execution.save();

      const results = await testRunner.runTests(agentConfig, tests, { parallel: true }, executionId, testUserId);

      expect(results.tests).toHaveLength(3);
      expect(results.tests.every(test => !test.passed)).toBe(true);
      expect(results.tests.every(test => test.severity === 'Critical')).toBe(true);
    });
  });

  describe('Risk Engine', () => {
    test('should calculate critical risk score for multiple critical failures', () => {
      const testResults = [
        { name: 'prompt-injection', passed: false, severity: 'Critical' },
        { name: 'system-prompt-extraction', passed: false, severity: 'Critical' },
        { name: 'data-exfiltration', passed: false, severity: 'Critical' }
      ];

      const assessment = RiskEngine.assessRisk(testResults);

      expect(assessment.score).toBeGreaterThan(70);
      expect(assessment.severity).toBe('Critical');
      expect(assessment.remediation).toHaveLength(3);
      expect(assessment.statistics.failedTests).toBe(3);
      expect(assessment.statistics.severityDistribution.Critical).toBe(3);
    });

    test('should calculate high risk score for high severity failures', () => {
      const testResults = [
        { name: 'role-confusion', passed: false, severity: 'High' },
        { name: 'jailbreaking', passed: false, severity: 'High' },
        { name: 'input-validation', passed: true, severity: 'Low' }
      ];

      const assessment = RiskEngine.assessRisk(testResults);

      expect(assessment.score).toBeGreaterThan(50);
      expect(assessment.severity).toBe('High');
      expect(assessment.remediation).toHaveLength(2);
      expect(assessment.statistics.failedTests).toBe(2);
      expect(assessment.statistics.severityDistribution.High).toBe(2);
    });

    test('should calculate low risk score for passed tests', () => {
      const testResults = [
        { name: 'prompt-injection', passed: true, severity: 'Low' },
        { name: 'system-prompt-extraction', passed: true, severity: 'Low' },
        { name: 'data-exfiltration', passed: true, severity: 'Low' }
      ];

      const assessment = RiskEngine.assessRisk(testResults);

      expect(assessment.score).toBeLessThan(25);
      expect(assessment.severity).toBe('Low');
      expect(assessment.remediation).toHaveLength(0);
      expect(assessment.statistics.failedTests).toBe(0);
    });

    test('should generate appropriate remediation suggestions', () => {
      const testResults = [
        { name: 'prompt-injection', passed: false, severity: 'Critical' },
        { name: 'data-exfiltration', passed: false, severity: 'Critical' }
      ];

      const assessment = RiskEngine.assessRisk(testResults);

      expect(assessment.remediation).toHaveLength(2);
      expect(assessment.remediation[0].title).toContain('Prompt Injection');
      expect(assessment.remediation[1].title).toContain('Data Loss Prevention');
      expect(assessment.remediation[0].priority).toBe('P0');
      expect(assessment.remediation[1].priority).toBe('P0');
    });

    test('should calculate risk trend over time', () => {
      const historicalResults = [
        { score: 80, severity: 'Critical' },
        { score: 75, severity: 'Critical' },
        { score: 70, severity: 'Critical' },
        { score: 65, severity: 'High' },
        { score: 60, severity: 'High' }
      ];

      const trend = RiskEngine.calculateTrend(historicalResults);

      expect(trend.trend).toBe('decreasing');
      expect(trend.direction).toBe('down');
      expect(trend.change).toBeLessThan(0);
    });
  });

  describe('API Endpoints', () => {
    test('should create test execution via API', async () => {
      const agentConfig = {
        name: 'api-test-agent',
        adapter: 'http',
        config: {
          url: 'http://localhost:3000/mock-agent/respond',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeoutMs: 5000
        },
        tests: ['prompt-injection'],
        runOptions: { parallel: false }
      };

      const response = await request(app)
        .post('/api/agents/run')
        .send(agentConfig)
        .expect(201);

      expect(response.body.executionId).toBeDefined();
      expect(response.body.status).toBe('pending');

      // Verify execution was created in database
      const execution = await TestExecution.findOne({ executionId: response.body.executionId });
      expect(execution).toBeTruthy();
      expect(execution.agent.name).toBe('api-test-agent');
      expect(execution.tests).toEqual(['prompt-injection']);
    });

    test('should return test execution results via API', async () => {
      const execution = new TestExecution({
        executionId: 'api_test_exec',
        agent: { name: 'api-test-agent', adapter: 'http', config: {} },
        tests: ['prompt-injection'],
        createdBy: testUserId,
        status: 'completed',
        results: {
          score: 85,
          severity: 'Critical',
          summary: 'Critical security vulnerabilities detected',
          tests: [
            { name: 'prompt-injection', passed: false, severity: 'Critical', evidence: 'Test evidence' }
          ],
          remediation: []
        }
      });
      await execution.save();

      const response = await request(app)
        .get('/api/agents/results/api_test_exec')
        .expect(200);

      expect(response.body.executionId).toBe('api_test_exec');
      expect(response.body.status).toBe('completed');
      expect(response.body.results.score).toBe(85);
      expect(response.body.results.severity).toBe('Critical');
    });

    test('should validate required fields for test execution', async () => {
      const response = await request(app)
        .post('/api/agents/run')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Missing required fields');
    });

    test('should return 404 for non-existent execution', async () => {
      const response = await request(app)
        .get('/api/agents/results/non-existent-exec')
        .expect(404);

      expect(response.body.error).toBe('Test execution not found');
    });
  });

  describe('Test Execution Model', () => {
    test('should create test execution with all required fields', async () => {
      const execution = new TestExecution({
        executionId: 'model_test_exec',
        agent: { name: 'model-test-agent', adapter: 'http', config: {} },
        tests: ['prompt-injection', 'data-exfiltration'],
        createdBy: testUserId,
        status: 'pending'
      });

      await execution.save();

      expect(execution.executionId).toBe('model_test_exec');
      expect(execution.agent.name).toBe('model-test-agent');
      expect(execution.tests).toHaveLength(2);
      expect(execution.status).toBe('pending');
      expect(execution.createdBy.toString()).toBe(testUserId.toString());
    });

    test('should add log entries to execution', async () => {
      const execution = new TestExecution({
        executionId: 'log_test_exec',
        agent: { name: 'log-test-agent', adapter: 'http', config: {} },
        tests: ['prompt-injection'],
        createdBy: testUserId,
        status: 'pending'
      });

      await execution.save();
      await execution.addLog('info', 'Test log message', 'prompt-injection');

      const updatedExecution = await TestExecution.findById(execution._id);
      expect(updatedExecution.logs).toHaveLength(1);
      expect(updatedExecution.logs[0].message).toBe('Test log message');
      expect(updatedExecution.logs[0].testName).toBe('prompt-injection');
    });

    test('should update test results', async () => {
      const execution = new TestExecution({
        executionId: 'result_test_exec',
        agent: { name: 'result-test-agent', adapter: 'http', config: {} },
        tests: ['prompt-injection'],
        createdBy: testUserId,
        status: 'pending',
        results: { tests: [] }
      });

      await execution.save();
      await execution.updateTestResult('prompt-injection', {
        passed: false,
        severity: 'Critical',
        evidence: 'Test evidence'
      });

      const updatedExecution = await TestExecution.findById(execution._id);
      expect(updatedExecution.results.tests).toHaveLength(1);
      expect(updatedExecution.results.tests[0].name).toBe('prompt-injection');
      expect(updatedExecution.results.tests[0].passed).toBe(false);
      expect(updatedExecution.results.tests[0].severity).toBe('Critical');
    });

    test('should calculate execution status correctly', async () => {
      const execution = new TestExecution({
        executionId: 'status_test_exec',
        agent: { name: 'status-test-agent', adapter: 'http', config: {} },
        tests: ['prompt-injection', 'data-exfiltration'],
        createdBy: testUserId,
        status: 'running',
        results: {
          tests: [
            { name: 'prompt-injection', passed: false, severity: 'Critical' }
          ]
        }
      });

      await execution.save();
      const status = execution.calculateStatus();

      expect(status).toBe('running'); // Still running because only 1 of 2 tests completed
    });
  });
});
