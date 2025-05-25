#!/bin/bash

# E2E Testing Workflow Script for CoinBox
# This script runs end-to-end tests and generates a comprehensive report

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to report test result
report_result() {
  local test_name=$1
  local result=$2
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✓ PASS: $test_name${NC}"
  else
    echo -e "${RED}✗ FAIL: $test_name${NC}"
    test_failures=$((test_failures + 1))
  fi
}

# Track test failures
test_failures=0

# Print banner
echo -e "${CYAN}"
echo "====================================================="
echo "           CoinBox E2E Testing Workflow              "
echo "====================================================="
echo -e "${NC}"

# 1. Install test dependencies if needed
echo -e "\n${CYAN}Step 1: Checking/installing test dependencies${NC}"
if ! npm list @playwright/test --depth=0 >/dev/null 2>&1; then
  echo "Installing Playwright dependencies..."
  npm install --no-save @playwright/test
  npx playwright install --with-deps chromium
else
  echo "Playwright dependencies already installed"
fi

# Check if application is running, if not start it
echo -e "\n${CYAN}Step 2: Ensuring application is running${NC}"
if ! curl -s http://localhost:3000 >/dev/null; then
  echo "Starting application in background..."
  npm run dev &
  APP_PID=$!
  echo "Waiting for application to start..."
  for i in {1..10}; do
    if curl -s http://localhost:3000 >/dev/null; then
      echo "Application started successfully"
      break
    fi
    if [ $i -eq 10 ]; then
      echo -e "${RED}Failed to start application${NC}"
      exit 1
    fi
    sleep 2
  done
else
  echo "Application is already running"
  APP_PID=""
fi

# 3. Run the onboarding tests
echo -e "\n${CYAN}Step 3: Running onboarding tests${NC}"
npm run test:e2e:onboarding
report_result "User Onboarding Tests" $?

# 4. Run the P2P trading tests
echo -e "\n${CYAN}Step 4: Running P2P trading tests${NC}"
npm run test:e2e:trading
report_result "P2P Trading Tests" $?

# 5. Run the system monitoring tests
echo -e "\n${CYAN}Step 5: Running system monitoring tests${NC}"
npm run test:e2e:monitoring
report_result "System Monitoring Tests" $?

# 6. Generate test report
echo -e "\n${CYAN}Step 6: Generating combined test report${NC}"

# Get the current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="e2e-test-reports_${TIMESTAMP}"

# Create report directory
mkdir -p "${REPORT_DIR}"

# Copy all test reports to the combined directory
cp -r playwright-report/* "${REPORT_DIR}/"

# Create an index file with summary
cat > "${REPORT_DIR}/summary.html" << EOL
<!DOCTYPE html>
<html>
<head>
  <title>CoinBox E2E Test Summary</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .pass { color: green; }
    .fail { color: red; }
    .summary { margin: 20px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>CoinBox E2E Test Summary</h1>
  <p>Test run completed on: $(date)</p>
  
  <div class="summary">
    <h2>Test Results:</h2>
    <p class="${test_failures > 0 ? 'fail' : 'pass'}">
      ${test_failures} test failures out of 3 test suites
    </p>
  </div>
  
  <h2>Test Reports:</h2>
  <ul>
    <li><a href="index.html">Full Test Report</a></li>
  </ul>
</body>
</html>
EOL

echo "Test report generated in ${REPORT_DIR}/summary.html"

# Clean up if we started the application
if [ -n "$APP_PID" ]; then
  echo -e "\n${CYAN}Step 7: Stopping application${NC}"
  kill $APP_PID
fi

# Final summary
echo -e "\n${CYAN}====================================================="
if [ $test_failures -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
else
  echo -e "${RED}${test_failures} test suites failed${NC}"
fi
echo -e "${CYAN}=====================================================${NC}"

exit $test_failures
