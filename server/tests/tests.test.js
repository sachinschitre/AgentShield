const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const TestSuite = require('../models/TestSuite');
const bcrypt = require('bcryptjs');

describe('Test Suite API', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Clean up data before each test
    await User.deleteMany({});
    await TestSuite.deleteMany({});

    // Create a test user and get auth token
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword
    });
    userId = user._id;

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword123'
      });

    authToken = loginResponse.body.token;
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
