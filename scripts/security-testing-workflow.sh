#!/bin/bash
# filepath: /workspaces/coinbox-ai/scripts/security-testing-workflow.sh

# Allied iMpact Coin Box Security Testing Workflow
# This script runs the comprehensive security testing suite for the platform

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}     Allied iMpact Coin Box Security Testing      ${NC}"
echo -e "${BLUE}==================================================${NC}"

# Function to report test step results
report_result() {
  local test_name=$1
  local result=$2

  if [ $result -eq 0 ]; then
    echo -e "  ${GREEN}✓ PASSED:${NC} $test_name"
  else
    echo -e "  ${RED}✗ FAILED:${NC} $test_name"
    failures=$((failures+1))
  fi
}

# Initialize failure counter
failures=0

# 1. Run linting on security files
echo -e "\n${CYAN}Step 1: Linting security components${NC}"
npx eslint src/lib/transaction-monitoring-service.ts src/lib/risk-event.ts src/middleware/trading-rate-limit.ts
report_result "Linting security files" $?

# 2. Run unit tests
echo -e "\n${CYAN}Step 2: Running unit tests${NC}"
npx vitest run src/tests/transaction-monitoring.test.ts
report_result "Transaction monitoring tests" $?

npx vitest run src/tests/trading-rate-limit.test.ts
report_result "Trading rate limit tests" $?

# 3. Run UI component tests
echo -e "\n${CYAN}Step 3: Running UI component tests${NC}"
npx vitest run src/tests/transaction-security-ui.test.tsx
report_result "User security UI tests" $?

npx vitest run src/tests/admin-transaction-monitoring.test.tsx
report_result "Admin monitoring UI tests" $?

# 4. Generate test coverage report
echo -e "\n${CYAN}Step 4: Generating test coverage report${NC}"
npx vitest run --coverage
report_result "Test coverage generation" $?

# 5. Run simple integration test
echo -e "\n${CYAN}Step 5: Running basic integration test${NC}"
cat << EOF > src/tests/integration-test.js
// Simple integration test to verify component connections
const { TransactionMonitoringService } = require('../lib/transaction-monitoring-service');
const { reportRiskEvent, RiskEvent } = require('../lib/risk-event');

async function testIntegration() {
  try {
    // Create mock service
    const mockNotifier = { notifyUser: () => {} };
    const service = new TransactionMonitoringService(mockNotifier);
    
    // Verify service initialized correctly
    if (!service.rules || !Array.isArray(service.rules)) {
      throw new Error('Rules not initialized correctly');
    }
    
    console.log('Basic integration test completed');
    return true;
  } catch (err) {
    console.error('Integration test failed:', err);
    return false;
  }
}

testIntegration().then(result => process.exit(result ? 0 : 1));
EOF

node src/tests/integration-test.js
report_result "Basic integration test" $?

# Print summary
echo -e "\n${BLUE}==================================================${NC}"
if [ $failures -eq 0 ]; then
  echo -e "${GREEN}All security tests passed!${NC}"
else
  echo -e "${RED}$failures test(s) failed!${NC}"
  echo -e "Review the output above for details."
fi
echo -e "${BLUE}==================================================${NC}"

# Exit with status based on tests
exit $failures
