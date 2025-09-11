# Getting Started with AgentShield

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **MongoDB** (version 4.4 or higher)
- **npm** or **yarn** package manager

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/agentshield.git
   cd agentshield
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/agentshield
   JWT_SECRET=your-super-secret-jwt-key
   CLIENT_URL=http://localhost:3000
   API_URL=http://localhost:5000/api
   ```

4. **Start MongoDB:**
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On Windows
   net start MongoDB
   ```

5. **Start the application:**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend client (port 3000).

6. **Open your browser:**
   Navigate to `http://localhost:3000` to access the AgentShield web interface.

## First Steps

### 1. Create an Account

1. Click "Sign up here" on the login page
2. Fill in your username, email, and password
3. Click "Create Account"

### 2. Create Your First Test Suite

1. Navigate to "Test Suites" in the sidebar
2. Click "Create Test Suite"
3. Fill in the basic information:
   - **Name**: Give your test suite a descriptive name
   - **Description**: Explain what this test suite will test
   - **Tags**: Add relevant tags (e.g., "api", "security", "production")

### 3. Add Test Categories

Choose from three main test categories:

#### Input Injection Testing
- **SQL Injection**: Test for SQL injection vulnerabilities
- **XSS**: Test for cross-site scripting vulnerabilities
- **Command Injection**: Test for command injection vulnerabilities
- **Path Traversal**: Test for directory traversal vulnerabilities

#### API Fuzzing
- **Authentication Bypass**: Test for authentication vulnerabilities
- **Rate Limiting**: Test API rate limiting mechanisms
- **Input Validation**: Test API input validation
- **CORS Testing**: Test CORS configuration

#### Agentic Workflow Testing
- **Prompt Injection**: Test for prompt injection vulnerabilities
- **Role Confusion**: Test for role confusion attacks
- **Data Exfiltration**: Test for data exfiltration vulnerabilities
- **Jailbreaking**: Test for AI model jailbreaking

### 4. Configure Test Cases

For each test category, you can:

1. **Set Target URL**: The endpoint you want to test
2. **Configure Payloads**: The test inputs to send
3. **Set Headers**: Custom HTTP headers
4. **Define Expected Behavior**: What responses should/shouldn't contain

### 5. Run Tests

1. Click "Run" on your test suite
2. Monitor the execution in real-time
3. View detailed results and any vulnerabilities found

### 6. Analyze Results

1. Navigate to "Results" to see all test executions
2. Click on a result to see detailed information
3. Review vulnerabilities by severity level
4. Export results as CSV or JSON

## Using Templates

AgentShield comes with pre-built templates for common testing scenarios:

1. Navigate to "Templates"
2. Browse available templates by category
3. Click "Use Template" on a template you want to use
4. Customize the configuration (target URL, headers, etc.)
5. Click "Create Test Suite" to add it to your test suites

## Best Practices

### Test Suite Organization

- **Use descriptive names**: Make it clear what each test suite tests
- **Add meaningful descriptions**: Help team members understand the purpose
- **Use tags effectively**: Organize test suites with relevant tags
- **Group related tests**: Keep similar tests in the same suite

### Test Configuration

- **Start with templates**: Use pre-built templates as starting points
- **Customize for your needs**: Modify templates to match your specific requirements
- **Test incrementally**: Start with basic tests and add complexity over time
- **Document your tests**: Add descriptions to help with maintenance

### Security Testing

- **Test regularly**: Run security tests as part of your CI/CD pipeline
- **Monitor results**: Set up notifications for critical vulnerabilities
- **Keep tests updated**: Update test cases as your application evolves
- **Review false positives**: Not all detected issues are real vulnerabilities

### Performance Considerations

- **Use appropriate timeouts**: Set reasonable timeouts for your tests
- **Consider parallel execution**: Use parallel execution for faster testing
- **Monitor resource usage**: Be aware of the impact on your target systems
- **Rate limit testing**: Be respectful of rate limits on external APIs

## Troubleshooting

### Common Issues

#### "Connection refused" errors
- Ensure MongoDB is running
- Check that the MONGODB_URI in your .env file is correct
- Verify MongoDB is accessible on the specified port

#### "Authentication failed" errors
- Check that your JWT_SECRET is set in the .env file
- Ensure the token hasn't expired (tokens expire after 7 days)
- Try logging out and logging back in

#### Tests not executing
- Verify the target URL is accessible
- Check that the target system accepts the HTTP methods you're using
- Ensure any required authentication is properly configured

#### Frontend not loading
- Check that both backend and frontend servers are running
- Verify the CLIENT_URL and API_URL are correctly configured
- Check browser console for any JavaScript errors

### Getting Help

- **Check the logs**: Look at server logs for error messages
- **Review the API documentation**: See `docs/API.md` for detailed API information
- **Check GitHub issues**: Look for similar issues in the project repository
- **Create an issue**: If you can't find a solution, create a new issue

## Next Steps

Once you're comfortable with the basics:

1. **Explore advanced features**: Learn about custom payloads and complex test scenarios
2. **Set up CI/CD integration**: Automate your security testing
3. **Create custom templates**: Build templates specific to your organization
4. **Monitor and alerting**: Set up notifications for critical vulnerabilities
5. **Team collaboration**: Invite team members and share test suites

## Additional Resources

- [API Documentation](API.md)
- [Test Category Reference](TEST_CATEGORIES.md)
- [Security Best Practices](SECURITY_BEST_PRACTICES.md)
- [Contributing Guidelines](CONTRIBUTING.md)
