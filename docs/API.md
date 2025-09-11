# AgentShield API Documentation

## Overview

AgentShield provides a RESTful API for managing test suites, executing security tests, and retrieving results. The API is built with Node.js and Express, and uses JWT for authentication.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All API endpoints (except auth endpoints) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "user"
  }
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "user",
    "preferences": {}
  }
}
```

#### GET /auth/me
Get current user profile.

**Response:**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "role": "string",
  "preferences": {},
  "lastLogin": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Test Suites

#### GET /tests
Get all test suites for the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term
- `category` (optional): Filter by category
- `tags` (optional): Filter by tags (comma-separated)

**Response:**
```json
{
  "testSuites": [
    {
      "_id": "string",
      "name": "string",
      "description": "string",
      "categories": [],
      "createdBy": "string",
      "isPublic": false,
      "tags": [],
      "settings": {},
      "lastExecuted": "2024-01-01T00:00:00.000Z",
      "executionCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

#### POST /tests
Create a new test suite.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "categories": [
    {
      "type": "input_injection",
      "name": "string",
      "description": "string",
      "tests": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "config": {},
          "enabled": true
        }
      ],
      "enabled": true
    }
  ],
  "tags": ["string"],
  "settings": {
    "timeout": 10000,
    "parallel": false,
    "retryCount": 0
  }
}
```

#### POST /tests/:id/execute
Execute a test suite.

**Request Body:**
```json
{
  "parallel": false,
  "timeout": 10000,
  "retryCount": 0
}
```

**Response:**
```json
{
  "executionId": "string",
  "status": "running",
  "message": "Test execution started"
}
```

### Test Results

#### GET /results
Get test results with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status
- `testSuiteId` (optional): Filter by test suite
- `severity` (optional): Filter by vulnerability severity
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

#### GET /results/:id
Get a specific test result.

#### GET /results/export/:id
Export test result as CSV or JSON.

**Query Parameters:**
- `format` (optional): Export format (json or csv, default: json)

### Configuration

#### GET /config/test-templates
Get predefined test templates.

#### GET /config/payloads
Get predefined payload libraries.

#### GET /config/severity-levels
Get vulnerability severity levels.

## Test Categories

### Input Injection Testing
Tests for various input injection vulnerabilities:
- SQL Injection
- Cross-Site Scripting (XSS)
- Command Injection
- Path Traversal
- LDAP Injection
- NoSQL Injection

### API Fuzzing
Tests API endpoints for security vulnerabilities:
- Authentication Bypass
- Authorization Issues
- Rate Limit Testing
- Input Validation
- Error Handling
- CORS Misconfiguration

### Agentic Workflow Testing
Tests AI agent workflows for vulnerabilities:
- Prompt Injection
- Role Confusion
- Data Exfiltration
- Jailbreaking
- Context Manipulation
- System Prompt Extraction

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": ["Additional error details"]
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

API requests are rate limited to 100 requests per 15-minute window per IP address.

## Examples

### Creating a SQL Injection Test

```bash
curl -X POST http://localhost:5000/api/tests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SQL Injection Test",
    "description": "Test for SQL injection vulnerabilities",
    "categories": [{
      "type": "input_injection",
      "name": "SQL Injection",
      "description": "Basic SQL injection tests",
      "tests": [{
        "id": "sql_test_1",
        "name": "Basic SQL Injection",
        "description": "Test basic SQL injection payloads",
        "config": {
          "targetUrl": "https://api.example.com/query",
          "payloads": [
            "' OR '1'='1",
            "'; DROP TABLE users; --"
          ],
          "expectedResponse": {
            "shouldNotContain": ["error", "exception"]
          }
        },
        "enabled": true
      }],
      "enabled": true
    }],
    "tags": ["sql", "injection"],
    "settings": {
      "timeout": 10000,
      "parallel": false,
      "retryCount": 0
    }
  }'
```

### Executing a Test Suite

```bash
curl -X POST http://localhost:5000/api/tests/123/execute \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "parallel": false,
    "timeout": 15000
  }'
```

### Getting Test Results

```bash
curl -X GET "http://localhost:5000/api/results?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```
