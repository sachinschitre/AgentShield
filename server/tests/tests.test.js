const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const TestSuite = require('../models/TestSuite');
const bcrypt = require('bcryptjs');

// Create a simple test app
const app = express();
app.use(express.json());

// Simple test routes
app.get('/api/tests', async (req, res) => {
  try {
    const testSuites = await TestSuite.find({ createdBy: req.user?.id });
    res.json({ testSuites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tests', async (req, res) => {
  try {
    const testSuiteData = { ...req.body, createdBy: req.user?.id };
    const testSuite = new TestSuite(testSuiteData);
    await testSuite.save();
    res.status(201).json(testSuite);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/tests/:id', async (req, res) => {
  try {
    const testSuite = await TestSuite.findById(req.params.id);
    if (!testSuite) {
      return res.status(404).json({ error: 'Test suite not found' });
    }
    res.json(testSuite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tests/:id', async (req, res) => {
  try {
    const testSuite = await TestSuite.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!testSuite) {
      return res.status(404).json({ error: 'Test suite not found' });
    }
    res.json(testSuite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tests/:id', async (req, res) => {
  try {
    const testSuite = await TestSuite.findByIdAndDelete(req.params.id);
    if (!testSuite) {
      return res.status(404).json({ error: 'Test suite not found' });
    }
    res.json({ message: 'Test suite deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple auth middleware for testing
let testUserId = null;
app.use((req, res, next) => {
  req.user = { id: testUserId };
  next();
});

describe('Test Suite API', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Clean up data before each test
    await User.deleteMany({});
    await TestSuite.deleteMany({});

    // Create a test user
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword
    });
    userId = user._id;
    testUserId = user._id;
    authToken = 'test-token';
  });

  describe('GET /api/tests', () => {
    it('should get all test suites for authenticated user', async () => {
      // Create a test suite
      await TestSuite.create({
        name: 'Test Suite 1',
        description: 'Test description',
        categories: [],
        createdBy: userId,
        tags: ['test'],
        settings: { timeout: 10000, parallel: false, retryCount: 0 }
      });

      const response = await request(app)
        .get('/api/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('testSuites');
      expect(response.body.testSuites).toHaveLength(1);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/tests')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/tests', () => {
    it('should create a new test suite', async () => {
      const testSuiteData = {
        name: 'New Test Suite',
        description: 'Test suite description',
        categories: [{
          type: 'input_injection',
          name: 'SQL Injection Test',
          description: 'Test for SQL injection vulnerabilities',
          tests: [{
            id: 'sql_test_1',
            name: 'Basic SQL Injection',
            description: 'Test basic SQL injection payloads',
            config: {
              targetUrl: 'https://httpbin.org/post',
              payloads: ["' OR '1'='1"],
              expectedResponse: {
                shouldNotContain: ['error', 'exception']
              }
            },
            enabled: true
          }],
          enabled: true
        }],
        tags: ['test', 'security'],
        settings: {
          timeout: 10000,
          parallel: false,
          retryCount: 0
        }
      };

      const response = await request(app)
        .post('/api/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testSuiteData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(testSuiteData.name);
      expect(response.body.description).toBe(testSuiteData.description);
      expect(response.body.categories).toHaveLength(1);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/tests/:id', () => {
    it('should get a specific test suite', async () => {
      const testSuite = await TestSuite.create({
        name: 'Test Suite',
        description: 'Test description',
        categories: [],
        createdBy: userId,
        tags: ['test'],
        settings: { timeout: 10000, parallel: false, retryCount: 0 }
      });

      const response = await request(app)
        .get(`/api/tests/${testSuite._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(testSuite.name);
    });

    it('should return 404 for non-existent test suite', async () => {
      const response = await request(app)
        .get('/api/tests/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/tests/:id', () => {
    it('should update a test suite', async () => {
      const testSuite = await TestSuite.create({
        name: 'Test Suite',
        description: 'Test description',
        categories: [],
        createdBy: userId,
        tags: ['test'],
        settings: { timeout: 10000, parallel: false, retryCount: 0 }
      });

      const updateData = {
        name: 'Updated Test Suite',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/tests/${testSuite._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
    });
  });

  describe('DELETE /api/tests/:id', () => {
    it('should delete a test suite', async () => {
      const testSuite = await TestSuite.create({
        name: 'Test Suite',
        description: 'Test description',
        categories: [],
        createdBy: userId,
        tags: ['test'],
        settings: { timeout: 10000, parallel: false, retryCount: 0 }
      });

      await request(app)
        .delete(`/api/tests/${testSuite._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      const response = await request(app)
        .get(`/api/tests/${testSuite._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
