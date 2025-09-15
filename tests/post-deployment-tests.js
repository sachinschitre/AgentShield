const axios = require('axios');

// Configuration
const ENV = process.env.ENV || 'staging';
const BASE_URL = process.env.URL || (ENV === 'production' ? 'https://agentshield.dev' : 'https://staging.agentshield.dev');

class PostDeploymentTester {
  constructor() {
    this.testResults = [];
  }

  async runTests() {
    console.log(`🚀 Starting Post-Deployment Tests for ${ENV}...`);
    console.log(`Base URL: ${BASE_URL}`);
    
    try {
      await this.testHealthEndpoint();
      await this.testAPIAvailability();
      await this.testFrontendAccessibility();
      await this.testDatabaseConnectivity();
      await this.testSecurityHeaders();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Post-deployment tests failed:', error);
      process.exit(1);
    }
  }

  async testHealthEndpoint() {
    console.log('\n📝 Testing Health Endpoint...');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/health`, {
        timeout: 10000
      });
      
      if (response.status === 200) {
        this.addResult('Health Endpoint', 'PASS', 'Health endpoint is accessible');
      } else {
        this.addResult('Health Endpoint', 'FAIL', `Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      this.addResult('Health Endpoint', 'FAIL', error.message);
    }
  }

  async testAPIAvailability() {
    console.log('\n📝 Testing API Availability...');
    
    try {
      // Test API endpoints without authentication
      const endpoints = [
        '/api/auth/register',
        '/api/auth/login',
        '/api/config/test-templates'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${BASE_URL}${endpoint}`, {
            timeout: 10000,
            validateStatus: () => true // Accept any status code
          });
          
          // We expect these endpoints to return 400/401 for GET requests, which is fine
          if (response.status === 400 || response.status === 401 || response.status === 200) {
            this.addResult(`API Endpoint ${endpoint}`, 'PASS', `Endpoint is accessible (status: ${response.status})`);
          } else {
            this.addResult(`API Endpoint ${endpoint}`, 'FAIL', `Unexpected status code: ${response.status}`);
          }
        } catch (error) {
          this.addResult(`API Endpoint ${endpoint}`, 'FAIL', error.message);
        }
      }
    } catch (error) {
      this.addResult('API Availability', 'FAIL', error.message);
    }
  }

  async testFrontendAccessibility() {
    console.log('\n📝 Testing Frontend Accessibility...');
    
    try {
      const response = await axios.get(BASE_URL, {
        timeout: 10000
      });
      
      if (response.status === 200) {
        this.addResult('Frontend Accessibility', 'PASS', 'Frontend is accessible');
        
        // Check if the page contains expected content
        if (response.data.includes('AgentShield')) {
          this.addResult('Frontend Content', 'PASS', 'Frontend contains expected content');
        } else {
          this.addResult('Frontend Content', 'FAIL', 'Frontend does not contain expected content');
        }
      } else {
        this.addResult('Frontend Accessibility', 'FAIL', `Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      this.addResult('Frontend Accessibility', 'FAIL', error.message);
    }
  }

  async testDatabaseConnectivity() {
    console.log('\n📝 Testing Database Connectivity...');
    
    try {
      // Test database connectivity by trying to register a test user
      const testUser = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'testpassword123'
      };
      
      const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser, {
        timeout: 10000
      });
      
      if (response.status === 201) {
        this.addResult('Database Connectivity', 'PASS', 'Database is accessible and writable');
      } else {
        this.addResult('Database Connectivity', 'FAIL', `Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
        this.addResult('Database Connectivity', 'PASS', 'Database is accessible (user already exists)');
      } else {
        this.addResult('Database Connectivity', 'FAIL', error.response?.data?.error || error.message);
      }
    }
  }

  async testSecurityHeaders() {
    console.log('\n📝 Testing Security Headers...');
    
    try {
      const response = await axios.get(BASE_URL, {
        timeout: 10000
      });
      
      const headers = response.headers;
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'strict-transport-security',
        'content-security-policy'
      ];
      
      let securityScore = 0;
      for (const header of securityHeaders) {
        if (headers[header]) {
          securityScore++;
          this.addResult(`Security Header ${header}`, 'PASS', 'Header is present');
        } else {
          this.addResult(`Security Header ${header}`, 'FAIL', 'Header is missing');
        }
      }
      
      const securityPercentage = (securityScore / securityHeaders.length) * 100;
      this.addResult('Overall Security Headers', 
        securityPercentage >= 80 ? 'PASS' : 'FAIL', 
        `${securityPercentage.toFixed(1)}% of security headers present`);
    } catch (error) {
      this.addResult('Security Headers', 'FAIL', error.message);
    }
  }

  addResult(testName, status, message) {
    this.testResults.push({ testName, status, message });
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${emoji} ${testName}: ${message}`);
  }

  printResults() {
    console.log('\n📊 Post-Deployment Test Results Summary:');
    console.log('==========================================');
    
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
      console.log('\n🎉 All post-deployment tests passed!');
    } else {
      console.log('\n💥 Some post-deployment tests failed!');
      process.exit(1);
    }
  }
}

// Run post-deployment tests
if (require.main === module) {
  const tester = new PostDeploymentTester();
  tester.runTests().catch(console.error);
}

module.exports = PostDeploymentTester;
