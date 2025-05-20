#!/bin/bash
# Security Testing Harness for CoinBox Authentication System

echo "========================================"
echo "CoinBox Authentication System Test Suite"
echo "========================================"
echo "Date: $(date)"
echo ""

# Check for test configuration
CONFIG_FILE="/workspaces/coinbox-ai/src/test-config.json"
CONFIG_EXAMPLE="/workspaces/coinbox-ai/src/test-config.example.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Error: test-config.json not found."
  echo "Please create a test configuration file by copying and modifying the example:"
  echo "cp $CONFIG_EXAMPLE $CONFIG_FILE"
  exit 1
fi

# Run unit/integration tests
run_integration_tests() {
  echo "Running authentication integration tests..."
  npm test -- --testPathPattern=src/tests/auth
}

# Run E2E tests if requested
run_e2e_tests() {
  echo "Running end-to-end authentication tests..."
  echo "Note: This will require manual interaction for reCAPTCHA and SMS verification"
  npx playwright test src/tests/auth.e2e.spec.ts
}

# Run security checks
run_security_checks() {
  echo "Running security checks on authentication system..."
  
  # Test rate limiting
  echo "Testing rate limiting..."
  node src/scripts/run-auth-tests.js rate-limiting
  
  # Test MFA enrollment flow
  echo "Testing MFA security..."
  node src/scripts/run-auth-tests.js mfa
  
  # Test logging system
  echo "Testing auth logging system..."
  node src/scripts/run-auth-tests.js logging
}

# Main execution
main() {
  case "$1" in
    integration)
      run_integration_tests
      ;;
    e2e)
      run_e2e_tests
      ;;
    security)
      run_security_checks
      ;;
    all)
      run_integration_tests
      run_security_checks
      echo ""
      echo "Note: End-to-end tests were skipped. Run with 'e2e' parameter to include them."
      ;;
    *)
      run_integration_tests
      echo ""
      echo "To run additional tests:"
      echo "  ./test-auth-system.sh e2e      # For end-to-end tests"
      echo "  ./test-auth-system.sh security # For security checks"
      echo "  ./test-auth-system.sh all      # For all tests except e2e"
      ;;
  esac
}

# Execute main with any provided arguments
main "$@"