const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const AGENTSHIELD_API_URL = 'http://localhost:5000/api';
const BENCHMARK_AGENTS = [
  {
    name: 'mock-vulnerable-agent',
    adapter: 'http',
    config: {
      url: 'http://localhost:6001/respond',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 10000
    },
    description: 'Intentionally vulnerable agent for testing security controls'
  },
  {
    name: 'mock-secure-agent',
    adapter: 'http',
    config: {
      url: 'http://localhost:6002/respond',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 10000
    },
    description: 'Secure agent with comprehensive security controls'
  }
];

const ALL_TESTS = [
  'prompt-injection',
  'system-prompt-extraction',
  'data-exfiltration',
  'role-confusion',
  'jailbreaking',
  'tool-abuse',
  'context-manipulation',
  'api-abuse',
  'privilege-escalation',
  'input-validation',
  'output-sanitization',
  'performance-impact'
];

class BenchmarkRunner {
  constructor() {
    this.results = [];
    this.authToken = null;
  }

  async authenticate() {
    try {
      console.log('🔐 Authenticating with AgentShield...');
      
      // Try to register a test user
      try {
        await axios.post(`${AGENTSHIELD_API_URL}/auth/register`, {
          username: 'benchmark-user',
          email: 'benchmark@agentshield.test',
          password: 'benchmark123'
        });
        console.log('✅ Test user registered');
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
          console.log('ℹ️  Test user already exists');
        } else {
          throw error;
        }
      }

      // Login
      const response = await axios.post(`${AGENTSHIELD_API_URL}/auth/login`, {
        email: 'benchmark@agentshield.test',
        password: 'benchmark123'
      });

      this.authToken = response.data.token;
      console.log('✅ Authentication successful');
    } catch (error) {
      console.error('❌ Authentication failed:', error.response?.data?.error || error.message);
      throw error;
    }
  }

  async runBenchmark(agent) {
    console.log(`\n🚀 Running benchmark for ${agent.name}...`);
    console.log(`📝 Description: ${agent.description}`);

    try {
      // Start test execution
      const runResponse = await axios.post(`${AGENTSHIELD_API_URL}/agents/run`, {
        name: agent.name,
        adapter: agent.adapter,
        config: agent.config,
        tests: ALL_TESTS,
        runOptions: {
          parallel: true,
          timeout: 30000
        }
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      const executionId = runResponse.data.executionId;
      console.log(`📊 Execution started: ${executionId}`);

      // Poll for results
      const results = await this.pollForResults(executionId);
      
      const benchmarkResult = {
        agent: agent,
        executionId: executionId,
        results: results,
        timestamp: new Date().toISOString()
      };

      this.results.push(benchmarkResult);
      console.log(`✅ Benchmark completed for ${agent.name}`);
      console.log(`📈 Risk Score: ${results.score}/100`);
      console.log(`⚠️  Severity: ${results.severity}`);
      console.log(`🔍 Failed Tests: ${results.tests.filter(t => !t.passed).length}/${results.tests.length}`);

      return benchmarkResult;
    } catch (error) {
      console.error(`❌ Benchmark failed for ${agent.name}:`, error.response?.data?.error || error.message);
      throw error;
    }
  }

  async pollForResults(executionId, maxAttempts = 30) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${AGENTSHIELD_API_URL}/agents/results/${executionId}`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });

        if (response.data.status === 'completed') {
          return response.data.results;
        } else if (response.data.status === 'failed') {
          throw new Error(`Test execution failed: ${response.data.error}`);
        }

        // Still running, wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        process.stdout.write('.');
      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
    }

    throw new Error('Timeout waiting for test results');
  }

  async runAllBenchmarks() {
    console.log('🎯 Starting AgentShield Benchmark Suite');
    console.log('=====================================');

    try {
      await this.authenticate();

      for (const agent of BENCHMARK_AGENTS) {
        await this.runBenchmark(agent);
      }

      await this.generateReport();
      console.log('\n🎉 All benchmarks completed successfully!');
      
    } catch (error) {
      console.error('\n💥 Benchmark suite failed:', error.message);
      process.exit(1);
    }
  }

  async generateReport() {
    console.log('\n📊 Generating benchmark report...');

    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        totalAgents: BENCHMARK_AGENTS.length,
        totalTests: ALL_TESTS.length
      },
      summary: this.generateSummary(),
      results: this.results,
      analysis: this.generateAnalysis()
    };

    // Create results directory
    const resultsDir = path.join(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Save JSON report
    const jsonPath = path.join(resultsDir, `benchmark-report-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report saved: ${jsonPath}`);

    // Save CSV report
    const csvPath = path.join(resultsDir, `benchmark-results-${Date.now()}.csv`);
    this.saveCSVReport(csvPath);
    console.log(`📊 CSV report saved: ${csvPath}`);

    // Print summary to console
    this.printSummary(report);
  }

  generateSummary() {
    const summary = {
      totalExecutions: this.results.length,
      averageScore: 0,
      severityDistribution: { Critical: 0, High: 0, Medium: 0, Low: 0 },
      testResults: {}
    };

    if (this.results.length === 0) return summary;

    // Calculate average score
    const totalScore = this.results.reduce((sum, result) => sum + result.results.score, 0);
    summary.averageScore = Math.round(totalScore / this.results.length);

    // Calculate severity distribution
    for (const result of this.results) {
      const severity = result.results.severity;
      summary.severityDistribution[severity]++;
    }

    // Calculate test results
    for (const testName of ALL_TESTS) {
      summary.testResults[testName] = {
        totalRuns: this.results.length,
        failures: 0,
        averageSeverity: 'Low'
      };

      let totalSeverity = 0;
      let severityCount = 0;

      for (const result of this.results) {
        const test = result.results.tests.find(t => t.name === testName);
        if (test && !test.passed) {
          summary.testResults[testName].failures++;
          
          // Convert severity to numeric for averaging
          const severityMap = { Low: 1, Medium: 2, High: 3, Critical: 4 };
          totalSeverity += severityMap[test.severity] || 1;
          severityCount++;
        }
      }

      if (severityCount > 0) {
        const avgSeverityNum = totalSeverity / severityCount;
        const severityMap = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
        summary.testResults[testName].averageSeverity = severityMap[Math.round(avgSeverityNum)];
      }
    }

    return summary;
  }

  generateAnalysis() {
    const analysis = {
      securityEffectiveness: {},
      recommendations: []
    };

    // Analyze security effectiveness
    for (const result of this.results) {
      const agentName = result.agent.name;
      analysis.securityEffectiveness[agentName] = {
        overallScore: result.results.score,
        severity: result.results.severity,
        failedTests: result.results.tests.filter(t => !t.passed).length,
        criticalIssues: result.results.tests.filter(t => !t.passed && t.severity === 'Critical').length,
        highIssues: result.results.tests.filter(t => !t.passed && t.severity === 'High').length
      };
    }

    // Generate recommendations
    const vulnerableAgent = this.results.find(r => r.agent.name === 'mock-vulnerable-agent');
    const secureAgent = this.results.find(r => r.agent.name === 'mock-secure-agent');

    if (vulnerableAgent && secureAgent) {
      if (vulnerableAgent.results.score > secureAgent.results.score) {
        analysis.recommendations.push('✅ Security controls are effective - vulnerable agent scored higher than secure agent');
      } else {
        analysis.recommendations.push('⚠️  Security controls may need improvement - score difference is minimal');
      }
    }

    if (vulnerableAgent && vulnerableAgent.results.score > 70) {
      analysis.recommendations.push('🚨 Vulnerable agent correctly identified as high-risk');
    }

    if (secureAgent && secureAgent.results.score < 30) {
      analysis.recommendations.push('✅ Secure agent correctly identified as low-risk');
    }

    return analysis;
  }

  saveCSVReport(filePath) {
    const headers = [
      'Agent Name',
      'Execution ID',
      'Risk Score',
      'Severity',
      'Total Tests',
      'Failed Tests',
      'Critical Issues',
      'High Issues',
      'Medium Issues',
      'Low Issues',
      'Timestamp'
    ];

    const rows = this.results.map(result => {
      const failedTests = result.results.tests.filter(t => !t.passed);
      const severityCounts = failedTests.reduce((acc, test) => {
        acc[test.severity] = (acc[test.severity] || 0) + 1;
        return acc;
      }, {});

      return [
        result.agent.name,
        result.executionId,
        result.results.score,
        result.results.severity,
        result.results.tests.length,
        failedTests.length,
        severityCounts.Critical || 0,
        severityCounts.High || 0,
        severityCounts.Medium || 0,
        severityCounts.Low || 0,
        result.timestamp
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    fs.writeFileSync(filePath, csvContent);
  }

  printSummary(report) {
    console.log('\n📋 BENCHMARK SUMMARY');
    console.log('==================');
    console.log(`Total Agents Tested: ${report.metadata.totalAgents}`);
    console.log(`Total Tests per Agent: ${report.metadata.totalTests}`);
    console.log(`Average Risk Score: ${report.summary.averageScore}/100`);
    console.log('\nSeverity Distribution:');
    console.log(`  Critical: ${report.summary.severityDistribution.Critical}`);
    console.log(`  High: ${report.summary.severityDistribution.High}`);
    console.log(`  Medium: ${report.summary.severityDistribution.Medium}`);
    console.log(`  Low: ${report.summary.severityDistribution.Low}`);

    console.log('\nAgent Results:');
    for (const result of this.results) {
      console.log(`  ${result.agent.name}: ${result.results.score}/100 (${result.results.severity})`);
    }

    console.log('\nRecommendations:');
    for (const rec of report.analysis.recommendations) {
      console.log(`  ${rec}`);
    }
  }
}

// Run benchmarks if this file is executed directly
if (require.main === module) {
  const runner = new BenchmarkRunner();
  runner.runAllBenchmarks().catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}

module.exports = BenchmarkRunner;
