# CoinBox Security Testing Harness

This document provides a comprehensive guide to the CoinBox authentication security testing harness and how to use it to verify the security of the authentication system.

## Table of Contents

1. [Overview](#overview)
2. [Testing Framework](#testing-framework)
3. [Test Types](#test-types)
4. [Running Tests](#running-tests)
5. [Interpreting Results](#interpreting-results)
6. [Troubleshooting](#troubleshooting)
7. [Extending the Testing Framework](#extending-the-testing-framework)

## Overview

The CoinBox Security Testing Harness is designed to verify the robustness and security of the authentication system. It tests various aspects of security including:

- Authentication flow integrity
- Rate limiting functionality
- Multi-factor authentication (MFA)
- Authentication event logging
- Security monitoring

The testing harness consists of automated tests, manual testing utilities, and documentation to help ensure that all security measures are functioning correctly.

## Testing Framework

The testing framework uses the following technologies:

- **Jest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **Node.js Scripts**: Specialized security tests
- **Bash Scripts**: Test orchestration

Test files are located in the following locations:

- `/src/tests/auth-integration.test.tsx`: Integration tests for authentication components
- `/src/tests/auth.e2e.spec.ts`: End-to-end tests for authentication flows
- `/src/tests/rate-limit-test.js`: Rate limiting tests
- `/src/tests/auth-logging-test.js`: Authentication logging tests
- `/scripts/test-auth-system.sh`: Test orchestration script
- `/src/scripts/run-auth-tests.js`: Interactive testing utility

## Test Types

### Integration Tests

Integration tests focus on the interaction between components and verify that the authentication system functions correctly as a whole. These tests include:

- Standard login flow testing
- Failed login handling
- MFA enrollment and verification
- Authentication context and state management

### End-to-End Tests

End-to-end tests simulate real user interactions with the authentication system. These tests require a running application and verify the complete user experience. They include:

- Login flow from the UI
- MFA flow from the UI
- Account management functionality
- Rate limiting from a user perspective

### Security Tests

Specialized security tests focus on specific security aspects:

- **Rate Limiting Tests**: Verify that the system properly limits authentication attempts to prevent brute force attacks
- **Logging Tests**: Ensure that all authentication events are properly logged for audit and monitoring purposes
- **MFA Tests**: Verify the security of the multi-factor authentication implementation

## Running Tests

### Prerequisites

1. Make sure you have Node.js and npm installed
2. Create a test configuration file by copying the example:
   ```
   cp /workspaces/coinbox-ai/src/test-config.example.json /workspaces/coinbox-ai/src/test-config.json
   ```
3. Update the test configuration with appropriate test credentials

### Using the Interactive Testing Utility

The easiest way to run tests is using the interactive testing utility:

```bash
node src/scripts/run-auth-tests.js
```

This will display a menu with various testing options:

1. Run All Authentication Tests
2. Test Standard Login Flow
3. Test Rate Limiting
4. Test MFA Functionality
5. Test Authentication Logging
6. Start Auth Test UI
7. Run Security Tests
8. Exit

### Running Specific Tests

You can also run specific tests directly:

#### Integration Tests
```bash
npm test -- --testPathPattern=src/tests/auth
```

#### Rate Limiting Tests
```bash
node src/tests/rate-limit-test.js
```

#### Authentication Logging Tests
```bash
node src/tests/auth-logging-test.js
```

#### All Security Tests
```bash
bash scripts/test-auth-system.sh all
```

#### End-to-End Tests
```bash
npx playwright test src/tests/auth.e2e.spec.ts
```

## Interpreting Results

### Integration Test Results

Integration tests will output detailed results indicating which tests passed and which failed. Failed tests will include error messages and stack traces to help identify the issue.

### Rate Limiting Test Results

The rate limiting test will attempt multiple authentication requests and report whether rate limiting was properly triggered. A successful test will show:

```
✅ Rate limiting detected! Test passed.
```

### Authentication Logging Test Results

The authentication logging test will output the logged events and indicate whether the events were properly recorded. A successful test will show:

```
Login/Logout Events: ✅ Passed
User Management Events: ✅ Passed
✅ All authentication logging tests passed.
```

## Troubleshooting

### Common Issues

#### Tests Failing Due to Firebase Configuration

If tests fail due to Firebase connection issues:
1. Check that your test-config.json file has valid Firebase credentials
2. Verify that the test user account exists and has the correct permissions

#### Rate Limiting Tests Not Detecting Limits

If rate limiting tests are not detecting limits:
1. Verify that rate limiting is properly configured in the Firebase project
2. Try increasing the number of attempts in the rate limiting test

#### MFA Tests Failing

MFA tests may require manual intervention:
1. For end-to-end MFA tests, you'll need to manually solve reCAPTCHA challenges
2. For verification code tests, you'll need access to the phone number receiving the SMS

### Getting Help

If you encounter issues that you cannot resolve:
1. Check the Firebase documentation for authentication settings
2. Review the test logs for specific error messages
3. Contact the security team for assistance

## Extending the Testing Framework

### Adding New Tests

To add new authentication security tests:

1. Create a new test file in the `/src/tests/` directory
2. Add the test logic using the appropriate testing framework
3. Update the test orchestration script to include the new test
4. Document the new test in this guide

### Modifying Existing Tests

When modifying existing tests:

1. Ensure backward compatibility with existing test reports
2. Update any affected documentation
3. Verify that all tests still pass after your changes

---

*Last updated: May 20, 2025*