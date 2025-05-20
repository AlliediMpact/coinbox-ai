# CoinBox Authentication Security Testing Harness

This document describes the security testing harness built into the CoinBox authentication system to ensure its robustness and security.

## Overview

The security testing harness is a comprehensive set of tools and utilities designed to validate the authentication system's security features, identify vulnerabilities, and ensure compliance with security best practices. It allows developers and security testers to simulate various attack scenarios and verify that the system's defenses are functioning correctly.

## Components

### 1. Authentication Testing Utilities (`/src/lib/auth-test-utils.ts`)

Core utilities for testing various authentication scenarios:

- `testStandardLogin`: Tests normal login flow
- `testRateLimiting`: Tests brute force protection by making multiple failed login attempts
- `testAuthLogging`: Tests that authentication events are properly logged
- `checkMfaStatus`: Verifies MFA configuration status

### 2. End-to-End Testing (`/src/tests/auth-e2e-utils.ts` and `/src/tests/auth.e2e.spec.ts`)

Playwright-based tests that simulate real user interactions:

- Authentication flow testing (login, logout)
- MFA enrollment and verification flow
- Rate limiting verification
- Security event generation and monitoring

### 3. Integration Tests (`/src/tests/auth-integration.test.tsx`)

Unit/integration tests covering:

- Authentication provider functionality
- MFA service operations
- Authentication logging
- Administrative panel functionality

### 4. Authentication Testing Page (`/src/app/dashboard/test-auth/page.tsx`)

An interactive UI for manual testing with tabs for:

- Standard login flow testing
- Rate limiting testing
- Authentication event logging testing
- MFA status checking and enrollment testing

## Security Scenarios Tested

The harness tests against the following security scenarios:

### Brute Force Protection

- Multiple failed login attempts from same IP
- Multiple failed attempts for same user from different IPs
- Distributed login attempts
- Password reset request flooding

### MFA Security

- Verification code bypass attempts
- Session hijacking prevention
- MFA enrollment security
- Phone number validation

### Authentication Logging

- Comprehensive event capturing
- Log tampering detection
- Suspicious activity patterns
- Administrative action auditing

### Account Security

- Account lockout functionality
- Password policy enforcement
- Session management
- Permission boundary testing

## Using the Security Testing Harness

### For Developers

1. Use the test utilities in your development workflow:

```typescript
import { testRateLimiting, testAuthLogging } from '@/lib/auth-test-utils';

// Test rate limiting
const results = await testRateLimiting('user@example.com', 'password', 10);
console.log(results);
```

2. Run the automated test suite:

```bash
npm test -- --testPathPattern=src/tests/auth
```

3. Use the testing page at `/dashboard/test-auth` for manual verification.

### For Security Auditors

1. Run the security test script:

```bash
./scripts/test-auth-system.sh
```

2. Use the admin authentication panel to review security events and logs.

3. Review the rate limiting configuration in the authentication settings.

## Security Testing Best Practices

When using the security testing harness:

1. **Use isolated environments**: Never run security tests against production.

2. **Document test results**: Keep detailed records of security test outcomes.

3. **Regular testing**: Run security tests after every significant authentication code change.

4. **Combine automated and manual testing**: Some security issues require human judgment.

5. **Update tests**: Keep the security test scenarios updated with new threat models.

## Extending the Security Testing Harness

The harness is designed to be extensible. To add new security tests:

1. Add new test methods to `auth-test-utils.ts`
2. Create new integration tests in the test directory
3. Update the test-auth page with new testing scenarios
4. Document the new tests and their purpose

---

*Last updated: May 20, 2025*
