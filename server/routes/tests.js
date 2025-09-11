const express = require('express');
const router = express.Router();
const TestSuite = require('../models/TestSuite');
const TestResult = require('../models/TestResult');
const TestExecutor = require('../services/TestExecutor');

const testExecutor = new TestExecutor();

/**
 * GET /api/tests
 * Get all test suites for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, tags } = req.query;
    const query = { createdBy: req.user.id };
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add category filter
    if (category) {
      query['categories.type'] = category;
    }
    
    // Add tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    const testSuites = await TestSuite.find(query)
      .populate('createdBy', 'username email')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TestSuite.countDocuments(query);

    res.json({
      testSuites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tests/:id
 * Get a specific test suite
 */
router.get('/:id', async (req, res) => {
  try {
    const testSuite = await TestSuite.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user.id },
        { isPublic: true }
      ]
    }).populate('createdBy', 'username email');

    if (!testSuite) {
      return res.status(404).json({ error: 'Test suite not found' });
    }

    res.json(testSuite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tests
 * Create a new test suite
 */
router.post('/', async (req, res) => {
  try {
    const testSuite = new TestSuite({
      ...req.body,
      createdBy: req.user.id
    });

    await testSuite.save();
    await testSuite.populate('createdBy', 'username email');

    res.status(201).json(testSuite);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/tests/:id
 * Update a test suite
 */
router.put('/:id', async (req, res) => {
  try {
    const testSuite = await TestSuite.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');

    if (!testSuite) {
      return res.status(404).json({ error: 'Test suite not found' });
    }

    res.json(testSuite);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/tests/:id
 * Delete a test suite
 */
router.delete('/:id', async (req, res) => {
  try {
    const testSuite = await TestSuite.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!testSuite) {
      return res.status(404).json({ error: 'Test suite not found' });
    }

    // Also delete associated test results
    await TestResult.deleteMany({ testSuiteId: testSuite._id });

    res.json({ message: 'Test suite deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tests/:id/execute
 * Execute a test suite
 */
router.post('/:id/execute', async (req, res) => {
  try {
    const testSuite = await TestSuite.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user.id },
        { isPublic: true }
      ]
    });

    if (!testSuite) {
      return res.status(404).json({ error: 'Test suite not found' });
    }

    const options = {
      parallel: req.body.parallel || testSuite.settings.parallel,
      timeout: req.body.timeout || testSuite.settings.timeout,
      retryCount: req.body.retryCount || testSuite.settings.retryCount
    };

    // Execute test suite
    const result = await testExecutor.executeTestSuite(testSuite, options);

    // Save result to database
    const testResult = new TestResult({
      ...result,
      testSuiteId: testSuite._id,
      executedBy: req.user.id,
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        environment: process.env.NODE_ENV || 'development'
      }
    });

    await testResult.save();

    // Update test suite execution info
    testSuite.lastExecuted = new Date();
    testSuite.executionCount += 1;
    await testSuite.save();

    res.json({
      executionId: result.executionId,
      status: result.status,
      message: 'Test execution started'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tests/:id/status/:executionId
 * Get execution status
 */
router.get('/:id/status/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    // Check active tests first
    let result = testExecutor.getActiveTest(executionId);
    
    // If not active, check completed results
    if (!result) {
      result = testExecutor.getTestResults(executionId);
    }
    
    // If still not found, check database
    if (!result) {
      const testResult = await TestResult.findOne({
        executionId,
        executedBy: req.user.id
      });
      
      if (!testResult) {
        return res.status(404).json({ error: 'Execution not found' });
      }
      
      result = testResult.toObject();
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tests/:id/cancel/:executionId
 * Cancel test execution
 */
router.post('/:id/cancel/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    const cancelled = testExecutor.cancelTest(executionId);
    
    if (cancelled) {
      res.json({ message: 'Test execution cancelled' });
    } else {
      res.status(404).json({ error: 'Active execution not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tests/categories
 * Get available test categories and their templates
 */
router.get('/categories', (req, res) => {
  const categories = [
    {
      type: 'input_injection',
      name: 'Input Injection Testing',
      description: 'Test for various input injection vulnerabilities',
      template: {
        name: 'SQL Injection Test',
        config: {
          targetUrl: 'https://api.example.com/process',
          payloads: [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users --"
          ],
          expectedResponse: {
            shouldNotContain: ['error', 'exception', 'stack trace']
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      }
    },
    {
      type: 'api_fuzzing',
      name: 'API Fuzzing',
      description: 'Test API endpoints for security vulnerabilities',
      template: {
        name: 'API Authentication Test',
        config: {
          targetUrl: 'https://api.example.com/protected',
          method: 'GET',
          payloads: [
            {},
            { token: 'invalid' },
            { token: '' }
          ],
          authConfig: {
            type: 'bearer',
            token: 'your-token-here'
          },
          expectedResponse: {
            requiresAuth: true
          }
        }
      }
    },
    {
      type: 'agentic_workflow',
      name: 'Agentic Workflow Testing',
      description: 'Test AI agent workflows for prompt injection and manipulation',
      template: {
        name: 'Prompt Injection Test',
        config: {
          workflowSteps: [
            {
              id: 'step1',
              endpoint: 'https://api.example.com/chat',
              prompt: 'Hello, how are you?'
            }
          ],
          injectionPoints: ['prompt'],
          expectedBehavior: {
            allowsRoleConfusion: false
          }
        }
      }
    }
  ];

  res.json(categories);
});

module.exports = router;
