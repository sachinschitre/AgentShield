## Cloudflare AI Agent Security Testing

Our project follows Cloudflare’s industry-leading AI agent security practices:

- Strict input/output validation and sanitization.
- Authentication with least-privilege policy enforcement using Cloudflare Zero Trust integrations.
- All agent requests are routed through Cloudflare AI Gateway for monitoring and access control.
- Sensitive data is protected using Cloudflare DLP (Data Loss Prevention) and Browser Isolation (where required).
- CI pipeline runs comprehensive agent security/vulnerability tests on every commit (see: `.github/workflows/cloudflare-agent-tests.yml`).

See [`docs/cloudflare-agent-testing.md`](./docs/cloudflare-agent-testing.md) for setup, usage, and hardening steps.

# Contributing to AgentShield

Thank you for your interest in contributing to AgentShield! This document provides guidelines and information for contributors.

## Code of Conduct

This project follows a code of conduct that we expect all contributors to follow. Please be respectful and inclusive in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/agentshield.git
   cd agentshield
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/your-org/agentshield.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up your environment**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names that indicate the type of change:
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages

Follow the conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add JWT token refresh functionality
fix(api): resolve test execution timeout issue
docs(api): update authentication endpoint documentation
```

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the coding standards
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Run the test suite** to ensure everything passes
6. **Commit your changes** with descriptive messages
7. **Push to your fork** and create a pull request

### Pull Request Guidelines

- **Clear title and description**: Explain what the PR does and why
- **Link related issues**: Use "Fixes #123" or "Closes #123" in the description
- **Keep PRs focused**: One feature or fix per PR
- **Request reviews**: Ask specific people to review if needed
- **Respond to feedback**: Address review comments promptly

## Coding Standards

### JavaScript/TypeScript

- Use **ESLint** and **Prettier** for code formatting
- Follow **Airbnb JavaScript Style Guide**
- Use **TypeScript** for type safety where applicable
- Write **self-documenting code** with clear variable and function names
- Add **JSDoc comments** for public APIs

### React/Next.js

- Use **functional components** with hooks
- Follow **React best practices** for performance
- Use **Material-UI** components consistently
- Implement **proper error boundaries**
- Use **React Query** for data fetching

### Backend (Node.js/Express)

- Follow **RESTful API** conventions
- Use **async/await** instead of callbacks
- Implement **proper error handling**
- Add **input validation** using Joi
- Use **Winston** for logging

### Database (MongoDB)

- Use **Mongoose** for ODM
- Follow **MongoDB best practices**
- Add **proper indexes** for performance
- Use **validation schemas**

## Testing

### Frontend Testing

```bash
cd client
npm test
```

- Write **unit tests** for components
- Write **integration tests** for API calls
- Test **user interactions** and workflows
- Use **React Testing Library** for component tests

### Backend Testing

```bash
cd server
npm test
```

- Write **unit tests** for utility functions
- Write **integration tests** for API endpoints
- Test **database operations**
- Use **Jest** for testing framework

### Test Coverage

- Aim for **80%+ test coverage**
- Focus on **critical business logic**
- Test **error conditions** and edge cases
- Include **performance tests** where relevant

## Documentation

### Code Documentation

- Add **JSDoc comments** for all public functions
- Include **parameter descriptions** and return types
- Add **usage examples** for complex functions
- Document **API endpoints** with clear descriptions

### User Documentation

- Update **README.md** for major changes
- Add **getting started guides** for new features
- Include **screenshots** for UI changes
- Write **tutorials** for complex workflows

### API Documentation

- Update **API.md** for endpoint changes
- Include **request/response examples**
- Document **error codes** and messages
- Add **authentication requirements**

## Security Considerations

### Code Security

- **Never commit secrets** or API keys
- Use **environment variables** for configuration
- Implement **input validation** and sanitization
- Follow **OWASP guidelines** for web security

### Testing Security

- Add **security test cases** for new features
- Test for **common vulnerabilities** (OWASP Top 10)
- Include **penetration testing** for critical features
- Review **third-party dependencies** for vulnerabilities

## Performance Guidelines

### Frontend Performance

- Use **code splitting** for large components
- Implement **lazy loading** for routes
- Optimize **bundle size** and loading times
- Use **React.memo** for expensive components

### Backend Performance

- Implement **caching** where appropriate
- Use **database indexes** for queries
- Optimize **API response times**
- Monitor **memory usage** and leaks

## Release Process

### Version Numbering

We use **Semantic Versioning** (SemVer):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version number bumped
- [ ] Release notes prepared
- [ ] Security review completed

## Getting Help

### Questions and Support

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord/Slack**: For real-time chat (if available)
- **Email**: For security-related issues

### Mentorship

- **New contributors**: Ask for help in GitHub discussions
- **Experienced contributors**: Offer to mentor newcomers
- **Code reviews**: Provide constructive feedback
- **Documentation**: Help improve guides and tutorials

## Recognition

Contributors will be recognized in:
- **CONTRIBUTORS.md** file
- **Release notes** for significant contributions
- **GitHub contributors** page
- **Project documentation**

## License

By contributing to AgentShield, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Thank You

Thank you for contributing to AgentShield! Your efforts help make AI applications more secure and reliable for everyone.
