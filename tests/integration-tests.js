const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

class IntegrationTester {
  constructor() {
    this.authToken = null;
    this.testResults = [];
  }

  async runTests() {
    console.log('🚀 Starting Integration Tests...');
    console.log(`API URL: ${API_URL}`);
    
    try {
      await this.testAuthentication();
      await this.testTestSuiteManagement();
      await this.testTestExecution();
      await this.testResultsAPI();
      await this.testConfigurationAPI();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Integration tests failed:', error);
      process.exit(1);
    }
  }

  async testAuthentication() {
    console.log('\n📝 Testing Authentication...');
    
    try {
      // Test user registration
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        username: 'integrationtestuser',
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });
      
      this.addResult('User Registration', 'PASS', 'User registered successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
        this.addResult('User Registration', 'PASS', 'User already exists (expected)');
      } else {
        this.addResult('User Registration', 'FAIL', error.response?.data?.error || error.message);
      }
    }

    try {
      // Test user login
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });
      
      this.authToken = loginResponse.data.token;
      this.addResult('User Login', 'PASS', 'User logged in successfully');
    } catch (error) {
      this.addResult('User Login', 'FAIL', error.response?.data?.error || error.message);
    }
  }

  async testTestSuiteManagement() {
    console.log('\n📝 Testing Test Suite Management...');
    
    if (!this.authToken) {
      this.addResult('Test Suite Management', 'SKIP', 'No auth token available');
      return;
    }

    try {
      // Create a test suite
      const testSuiteData = {
        name: 'Integration Test Suite',
        description: 'Test suite created during integration tests',
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
        tags: ['integration', 'test'],
        settings: {
          timeout: 10000,
          parallel: false,
          retryCount: 0
        }
      };

      const createResponse = await axios.post(`${API_URL}/tests`, testSuiteData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      this.testSuiteId = createResponse.data._id;
      this.addResult('Create Test Suite', 'PASS', 'Test suite created successfully');
    } catch (error) {
      this.addResult('Create Test Suite', 'FAIL', error.response?.data?.error || error.message);
    }

    try {
      // Get test suites
      const getResponse = await axios.get(`${API_URL}/tests`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      this.addResult('Get Test Suites', 'PASS', `Found ${getResponse.data.testSuites.length} test suites`);
    } catch (error) {
      this.addResult('Get Test Suites', 'FAIL', error.response?.data?.error || error.message);
    }
  }

  async testTestExecution() {
    console.log('\n📝 Testing Test Execution...');
    
    if (!this.authToken || !this.testSuiteId) {
      this.addResult('Test Execution', 'SKIP', 'No test suite available');
      return;
    }

    try {
      // Execute test suite
      const executionResponse = await axios.post(`${API_URL}/tests/${this.testSuiteId}/execute`, {
        parallel: false,
        timeout: 15000
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      this.executionId = executionResponse.data.executionId;
      this.addResult('Execute Test Suite', 'PASS', 'Test execution started successfully');
    } catch (error) {
      this.addResult('Execute Test Suite', 'FAIL', error.response?.data?.error || error.message);
    }

    if (this.executionId) {
      try {
        // Wait for execution to complete
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check execution status
        const statusResponse = await axios.get(`${API_URL}/results/${this.executionId}`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });

        this.addResult('Check Execution Status', 'PASS', `Execution status: ${statusResponse.data.status}`);
      } catch (error) {
        this.addResult('Check Execution Status', 'FAIL', error.response?.data?.error || error.message);
      }
    }
  }

  async testResultsAPI() {
    console.log('\n📝 Testing Results API...');
    
    if (!this.authToken) {
      this.addResult('Results API', 'SKIP', 'No auth token available');
      return;
    }

    try {
      // Get all results
      const resultsResponse = await axios.get(`${API_URL}/results`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      this.addResult('Get Results', 'PASS', `Found ${resultsResponse.data.results.length} results`);
    } catch (error) {
      this.addResult('Get Results', 'FAIL', error.response?.data?.error || error.message);
    }
  }

  async testConfigurationAPI() {
    console.log('\n📝 Testing Configuration API...');
    
    if (!this.authToken) {
      this.addResult('Configuration API', 'SKIP', 'No auth token available');
      return;
    }

    try {
      // Get test templates
      const templatesResponse = await axios.get(`${API_URL}/config/test-templates`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      this.addResult('Get Test Templates', 'PASS', `Found ${templatesResponse.data.templates.length} templates`);
    } catch (error) {
      this.addResult('Get Test Templates', 'FAIL', error.response?.data?.error || error.message);
    }
  }

  addResult(testName, status, message) {
    this.testResults.push({ testName, status, message });
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${emoji} ${testName}: ${message}`);
  }

  printResults() {
    console.log('\n📊 Integration Test Results Summary:');
    console.log('=====================================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`📊 Total: ${this.testResults.length}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.testName}: ${r.message}`));
    }
    
    if (failed === 0) {
      console.log('\n🎉 All integration tests passed!');
    } else {
      console.log('\n💥 Some integration tests failed!');
      process.exit(1);
    }
  }
}

// Run integration tests
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runTests().catch(console.error);
}

module.exports = IntegrationTester;
