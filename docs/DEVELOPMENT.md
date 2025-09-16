# AgentShield Development Guide

This guide covers how to add new agent tests, remediation items, and extend AgentShield's security testing capabilities.

## Adding New Agent Tests

### 1. Define Test Payload

Add your test payload to `server/services/tests/fixtures/testPayloads.js`:

```javascript
'your-test-name': {
  testType: 'your-test-name',
  messages: [
    {
      role: 'user',
      content: 'Your test payload here'
    }
  ],
  prompt: 'Your test payload here'
}
```

### 2. Implement Test Analyzer

Add an analyzer method to `server/services/agentTestRunner.js`:

```javascript
analyzeYourTest(response, payload) {
  const responseText = JSON.stringify(response.data).toLowerCase();
  
  // Define patterns to detect
  const maliciousPatterns = [
    /your-pattern-here/gi,
    /another-pattern/gi
  ];

  for (const pattern of maliciousPatterns) {
    if (pattern.test(responseText)) {
      return {
        passed: false,
        severity: 'High', // or 'Critical', 'Medium', 'Low'
        evidence: `Your test detected: Response contains "${pattern.source}" pattern`
      };
    }
  }

  return {
    passed: true,
    severity: 'Low',
    evidence: 'No security issues detected'
  };
}
```

### 3. Register Test Analyzer

Add your test to the `analyzeResponse` method in `agentTestRunner.js`:

```javascript
const analyzers = {
  // ... existing analyzers
  'your-test-name': this.analyzeYourTest.bind(this),
};
```

### 4. Add Test to Available Tests

Update `server/routes/agentAdapters.js` to include your test in the available tests list:

```javascript
const validTests = [
  // ... existing tests
  'your-test-name'
];
```

### 5. Add Test Description

Update the `/api/agents/tests` endpoint in `agentAdapters.js`:

```javascript
{
  name: 'your-test-name',
  description: 'Description of what this test does',
  severity: 'High',
  category: 'Your Category'
}
```

## Adding Remediation Suggestions

### 1. Update Remediation Map

Add your remediation to `server/config/remediationMap.json`:

```json
{
  "your-test-name": {
    "title": "Fix Your Test Vulnerability",
    "description": "Detailed description of how to fix the issue",
    "category": "Security Category",
    "estimatedEffort": "2-4 hours",
    "codeExamples": [
      {
        "language": "javascript",
        "title": "Example Fix",
        "code": "function fixVulnerability(input) {\n  // Your code here\n}"
      }
    ],
    "references": [
      "https://example.com/security-guide",
      "https://owasp.org/your-reference"
    ]
  }
}
```

### 2. Update Risk Engine

If needed, update the risk scoring in `server/services/riskEngine.js`:

```javascript
this.severityWeights = {
  'Critical': 30,
  'High': 15,
  'Medium': 7,
  'Low': 3,
  'Your-Severity': 10 // Add custom severity if needed
};
```

## Adding New Agent Adapters

### 1. Implement Adapter Method

Add your adapter method to `server/services/agentTestRunner.js`:

```javascript
async yourAdapter(config, payload) {
  // Implement your adapter logic
  const response = await yourApiCall(config, payload);
  
  return {
    status: response.status,
    data: response.data,
    headers: response.headers
  };
}
```

### 2. Register Adapter

Add your adapter to the adapters object:

```javascript
this.adapters = {
  http: this.httpAdapter.bind(this),
  openai: this.openaiAdapter.bind(this),
  mock: this.mockAdapter.bind(this),
  yourAdapter: this.yourAdapter.bind(this)
};
```

### 3. Update Valid Adapters

Update the valid adapters list in `server/routes/agentAdapters.js`:

```javascript
const validAdapters = ['http', 'openai', 'mock', 'yourAdapter'];
```

### 4. Add Adapter Documentation

Update the `/api/agents/adapters` endpoint to include your adapter:

```javascript
{
  type: 'yourAdapter',
  name: 'Your Adapter Name',
  description: 'Description of your adapter',
  configSchema: {
    yourConfig: { type: 'string', required: true, description: 'Your config description' }
  }
}
```

## Testing Your Changes

### 1. Unit Tests

Add tests to `server/tests/agenticWorkflow.spec.js`:

```javascript
test('should run your test and detect vulnerability', async () => {
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

  const tests = ['your-test-name'];
  const executionId = 'test_exec_your_test';

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
  expect(results.tests[0].name).toBe('your-test-name');
  expect(results.tests[0].passed).toBe(false);
  expect(results.tests[0].severity).toBe('High');
});
```

### 2. Integration Tests

Test your changes with the benchmark agents:

```bash
# Start vulnerable agent
npm run example:vulnerable-agent

# Run your test
npm run test:agentic

# Run full benchmark
npm run test:benchmarks
```

### 3. Frontend Testing

Test the UI integration by:

1. Starting the development server: `npm run dev`
2. Navigating to the risk report dashboard
3. Running a test with your new test type
4. Verifying the results display correctly

## Code Style Guidelines

### Backend (Node.js/Express)

- Use async/await for asynchronous operations
- Follow RESTful API conventions
- Use JSDoc comments for functions
- Implement proper error handling
- Use Winston for logging

### Frontend (React/TypeScript)

- Use TypeScript interfaces for type safety
- Follow React hooks patterns
- Use Material-UI components consistently
- Implement proper error boundaries
- Use SWR for data fetching

### Testing

- Write tests for all new functionality
- Use descriptive test names
- Mock external dependencies
- Test both success and failure cases
- Maintain high test coverage

## Security Considerations

### Input Validation

- Always validate and sanitize user inputs
- Use Joi schemas for request validation
- Implement rate limiting for API endpoints
- Log security events appropriately

### Data Protection

- Never log sensitive data (API keys, passwords)
- Use environment variables for secrets
- Implement proper CORS policies
- Use HTTPS in production

### Test Security

- Ensure test payloads don't contain real credentials
- Use mock data for testing
- Don't expose internal system information in test responses
- Implement proper authentication for test endpoints

## Performance Optimization

### Backend

- Use connection pooling for database connections
- Implement caching where appropriate
- Use async operations for I/O
- Monitor memory usage and garbage collection

### Frontend

- Implement lazy loading for components
- Use React.memo for expensive components
- Optimize bundle size
- Implement proper error boundaries

## Deployment Considerations

### Environment Variables

- Use different configurations for development, staging, and production
- Never commit secrets to version control
- Use proper secret management in production

### Database

- Use proper indexing for performance
- Implement database migrations
- Use connection pooling
- Monitor database performance

### Monitoring

- Implement health checks
- Use structured logging
- Monitor API response times
- Set up alerting for critical issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following these guidelines
4. Add comprehensive tests
5. Update documentation
6. Submit a pull request

## Resources

- [OWASP AI Security Guidelines](https://owasp.org/www-project-ai-security-guidelines/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [React Best Practices](https://react.dev/learn)
- [Material-UI Documentation](https://mui.com/)
