const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const TestExecution = require('../models/TestExecution');
const AgentTestRunner = require('../services/agentTestRunner');
const logger = require('winston');

// Initialize test runner
const testRunner = new AgentTestRunner();

/**
 * @route POST /api/agents/run
 * @desc Run security tests against an agent
 * @access Private
 */
router.post('/run', async (req, res) => {
  try {
    const { name, adapter, config, tests, runOptions = {} } = req.body;

    // Validate required fields
    if (!name || !adapter || !config || !tests || !Array.isArray(tests)) {
      return res.status(400).json({
        error: 'Missing required fields: name, adapter, config, tests'
      });
    }

    // Validate adapter type
    const validAdapters = ['http', 'openai', 'mock'];
    if (!validAdapters.includes(adapter)) {
      return res.status(400).json({
        error: `Invalid adapter type. Must be one of: ${validAdapters.join(', ')}`
      });
    }

    // Validate test names
    const validTests = [
      'prompt-injection',
      'role-confusion',
      'system-prompt-extraction',
      'data-exfiltration',
      'jailbreaking',
      'tool-abuse',
      'context-manipulation',
      'api-abuse',
      'privilege-escalation',
      'input-validation',
      'output-sanitization',
      'performance-impact'
    ];

    const invalidTests = tests.filter(test => !validTests.includes(test));
    if (invalidTests.length > 0) {
      return res.status(400).json({
        error: `Invalid test names: ${invalidTests.join(', ')}`
      });
    }

    // Validate adapter-specific config
    if (adapter === 'http') {
      if (!config.url) {
        return res.status(400).json({
          error: 'HTTP adapter requires url in config'
        });
      }
    } else if (adapter === 'openai') {
      if (!config.apiKey || !config.model) {
        return res.status(400).json({
          error: 'OpenAI adapter requires apiKey and model in config'
        });
      }
    }

    // Sanitize config to remove sensitive data from logs
    const sanitizedConfig = { ...config };
    if (sanitizedConfig.apiKey) {
      sanitizedConfig.apiKey = '***REDACTED***';
    }
    if (sanitizedConfig.headers && sanitizedConfig.headers.Authorization) {
      sanitizedConfig.headers.Authorization = '***REDACTED***';
    }

    // Generate unique execution ID
    const executionId = `exec_${Date.now()}_${uuidv4().substring(0, 8)}`;

    // Create test execution record
    const execution = new TestExecution({
      executionId,
      agent: {
        name,
        adapter,
        config: sanitizedConfig
      },
      tests,
      runOptions: {
        parallel: runOptions.parallel !== false,
        timeout: runOptions.timeout || 30000
      },
      createdBy: req.user.id,
      status: 'pending'
    });

    await execution.save();

    logger.info(`Created test execution ${executionId} for agent ${name}`);

    // Start test execution asynchronously
    setImmediate(async () => {
      try {
        await testRunner.runTests(
          { name, adapter, config },
          tests,
          execution.runOptions,
          executionId,
          req.user.id
        );
      } catch (error) {
        logger.error(`Test execution ${executionId} failed:`, error);
      }
    });

    res.status(201).json({
      executionId,
      status: 'pending',
      message: 'Test execution started',
      tests: tests.length,
      estimatedDuration: `${tests.length * 2} seconds`
    });

  } catch (error) {
    logger.error('Error creating test execution:', error);
    res.status(500).json({
      error: 'Failed to start test execution',
      details: error.message
    });
  }
});

/**
 * @route GET /api/agents/results/:executionId
 * @desc Get test execution results
 * @access Private
 */
router.get('/results/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;

    const execution = await TestExecution.findOne({
      executionId,
      createdBy: req.user.id
    });

    if (!execution) {
      return res.status(404).json({
        error: 'Test execution not found'
      });
    }

    // Calculate current status
    execution.calculateStatus();

    const response = {
      executionId: execution.executionId,
      agent: execution.agent,
      status: execution.status,
      tests: execution.tests,
      runOptions: execution.runOptions,
      results: execution.results,
      logs: execution.logs.slice(-50), // Return last 50 log entries
      createdAt: execution.createdAt,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      duration: execution.duration,
      error: execution.error
    };

    res.json(response);

  } catch (error) {
    logger.error('Error fetching test results:', error);
    res.status(500).json({
      error: 'Failed to fetch test results',
      details: error.message
    });
  }
});

/**
 * @route GET /api/agents/executions
 * @desc Get list of test executions for user
 * @access Private
 */
router.get('/executions', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, severity } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { createdBy: req.user.id };
    if (status) filter.status = status;
    if (severity) filter['results.severity'] = severity;

    const executions = await TestExecution.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('executionId agent status results.score results.severity createdAt completedAt duration')
      .lean();

    const total = await TestExecution.countDocuments(filter);

    res.json({
      executions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Error fetching executions:', error);
    res.status(500).json({
      error: 'Failed to fetch executions',
      details: error.message
    });
  }
});

/**
 * @route GET /api/agents/statistics
 * @desc Get test execution statistics for user
 * @access Private
 */
router.get('/statistics', async (req, res) => {
  try {
    const { timeRange = 30 } = req.query;
    const stats = await TestExecution.getStatistics(req.user.id, parseInt(timeRange));

    if (stats.length === 0) {
      return res.json({
        totalExecutions: 0,
        completedExecutions: 0,
        failedExecutions: 0,
        averageScore: 0,
        severityDistribution: {
          Critical: 0,
          High: 0,
          Medium: 0,
          Low: 0
        }
      });
    }

    const result = stats[0];
    res.json({
      totalExecutions: result.totalExecutions,
      completedExecutions: result.completedExecutions,
      failedExecutions: result.failedExecutions,
      averageScore: Math.round(result.averageScore || 0),
      severityDistribution: {
        Critical: result.criticalCount,
        High: result.highCount,
        Medium: result.mediumCount,
        Low: result.lowCount
      }
    });

  } catch (error) {
    logger.error('Error fetching statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
});

/**
 * @route DELETE /api/agents/executions/:executionId
 * @desc Delete a test execution
 * @access Private
 */
router.delete('/executions/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;

    const execution = await TestExecution.findOneAndDelete({
      executionId,
      createdBy: req.user.id
    });

    if (!execution) {
      return res.status(404).json({
        error: 'Test execution not found'
      });
    }

    logger.info(`Deleted test execution ${executionId} for user ${req.user.id}`);

    res.json({
      message: 'Test execution deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting execution:', error);
    res.status(500).json({
      error: 'Failed to delete execution',
      details: error.message
    });
  }
});

/**
 * @route GET /api/agents/tests
 * @desc Get available test types and their descriptions
 * @access Private
 */
router.get('/tests', (req, res) => {
  const availableTests = [
    {
      name: 'prompt-injection',
      description: 'Test for prompt injection vulnerabilities that could override system instructions',
      severity: 'Critical',
      category: 'Input Validation'
    },
    {
      name: 'system-prompt-extraction',
      description: 'Test for system prompt extraction attempts',
      severity: 'Critical',
      category: 'Information Disclosure'
    },
    {
      name: 'data-exfiltration',
      description: 'Test for unauthorized data exfiltration and sensitive information leakage',
      severity: 'Critical',
      category: 'Data Protection'
    },
    {
      name: 'role-confusion',
      description: 'Test for role confusion attacks that attempt to change agent permissions',
      severity: 'High',
      category: 'Access Control'
    },
    {
      name: 'jailbreaking',
      description: 'Test for jailbreaking attempts to bypass safety constraints',
      severity: 'High',
      category: 'Safety Bypass'
    },
    {
      name: 'tool-abuse',
      description: 'Test for unauthorized tool usage and command execution',
      severity: 'High',
      category: 'Tool Security'
    },
    {
      name: 'context-manipulation',
      description: 'Test for context manipulation and memory exploitation',
      severity: 'Medium',
      category: 'Context Security'
    },
    {
      name: 'api-abuse',
      description: 'Test for API abuse and rate limiting bypass',
      severity: 'Medium',
      category: 'API Security'
    },
    {
      name: 'privilege-escalation',
      description: 'Test for privilege escalation attempts',
      severity: 'High',
      category: 'Access Control'
    },
    {
      name: 'input-validation',
      description: 'Test for input validation and sanitization',
      severity: 'Medium',
      category: 'Input Validation'
    },
    {
      name: 'output-sanitization',
      description: 'Test for output sanitization and content filtering',
      severity: 'Medium',
      category: 'Output Security'
    },
    {
      name: 'performance-impact',
      description: 'Test for performance impact of security controls',
      severity: 'Low',
      category: 'Performance'
    }
  ];

  res.json({
    tests: availableTests,
    total: availableTests.length,
    categories: [...new Set(availableTests.map(test => test.category))]
  });
});

/**
 * @route GET /api/agents/adapters
 * @desc Get available adapter types and their configurations
 * @access Private
 */
router.get('/adapters', (req, res) => {
  const adapters = [
    {
      type: 'http',
      name: 'HTTP Agent',
      description: 'Test agents accessible via HTTP endpoints',
      configSchema: {
        url: { type: 'string', required: true, description: 'Agent endpoint URL' },
        method: { type: 'string', default: 'POST', description: 'HTTP method' },
        headers: { type: 'object', description: 'HTTP headers' },
        timeoutMs: { type: 'number', default: 10000, description: 'Request timeout in milliseconds' }
      }
    },
    {
      type: 'openai',
      name: 'OpenAI Compatible',
      description: 'Test OpenAI-compatible language models',
      configSchema: {
        apiKey: { type: 'string', required: true, description: 'OpenAI API key' },
        model: { type: 'string', required: true, description: 'Model name (e.g., gpt-4)' },
        max_tokens: { type: 'number', default: 1000, description: 'Maximum tokens in response' },
        temperature: { type: 'number', default: 0.7, description: 'Response randomness' },
        timeoutMs: { type: 'number', default: 10000, description: 'Request timeout in milliseconds' }
      }
    },
    {
      type: 'mock',
      name: 'Mock Agent',
      description: 'Test with mock responses for development and testing',
      configSchema: {
        responseDelay: { type: 'number', default: 500, description: 'Simulated response delay' },
        failureRate: { type: 'number', default: 0, description: 'Simulated failure rate (0-1)' }
      }
    }
  ];

  res.json({
    adapters,
    total: adapters.length
  });
});

module.exports = router;
