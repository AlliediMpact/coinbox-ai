#!/bin/bash
# filepath: /workspaces/coinbox-ai/scripts/security-audit.sh

echo "=== CoinBox AI Security Audit Script ==="
echo "Running comprehensive security checks..."
echo ""

# Check for rate limiting
echo "== Testing Rate Limiting =="
echo "1. Testing authentication rate limiting..."
node ./src/tests/rate-limiting/auth-rate-limit-test.js

echo "2. Testing trading rate limiting..."
node ./src/tests/rate-limiting/trading-rate-limit-test.js

echo "3. Testing API rate limiting..."
node ./src/tests/rate-limiting/api-rate-limit-test.js

# Check RBAC implementation
echo ""
echo "== Testing Role-Based Access Control =="
echo "1. Verifying admin-only routes..."
node ./src/tests/security/rbac-admin-routes-test.js

echo "2. Verifying support-only routes..."
node ./src/tests/security/rbac-support-routes-test.js

echo "3. Verifying role permissions..."
node ./src/tests/security/rbac-permissions-test.js

# Check authentication security
echo ""
echo "== Testing Authentication Security =="
echo "1. Testing JWT token security..."
node ./src/tests/security/jwt-security-test.js

echo "2. Testing MFA implementation..."
node ./src/tests/security/mfa-security-test.js

# Check input validation and sanitization
echo ""
echo "== Testing Input Validation =="
echo "1. Testing API input validation..."
node ./src/tests/security/api-input-validation-test.js

echo "2. Testing form validation..."
node ./src/tests/security/form-validation-test.js

# Check for SQL injection vulnerabilities
echo ""
echo "== Testing for Injection Vulnerabilities =="
node ./src/tests/security/injection-vulnerability-test.js

# Check for XSS vulnerabilities
echo ""
echo "== Testing for XSS Vulnerabilities =="
node ./src/tests/security/xss-vulnerability-test.js

# Check transaction security
echo ""
echo "== Testing Transaction Security =="
echo "1. Testing escrow system..."
node ./src/tests/security/escrow-security-test.js

echo "2. Testing transaction limits enforcement..."
node ./src/tests/security/transaction-limits-test.js

# Generate security report
echo ""
echo "== Generating Security Report =="
node ./src/scripts/generate-security-report.js

echo ""
echo "Security audit complete. Please review the report in ./security-report.html"
