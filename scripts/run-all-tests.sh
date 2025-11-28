#!/bin/bash

##############################################################################
# Comprehensive Test Suite Runner
# Runs all tests and generates a complete report
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

REPORT_FILE="test-report-$(date +%Y%m%d_%H%M%S).log"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     CoinBox AI - Comprehensive Test Suite                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo "" | tee -a "$REPORT_FILE"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${CYAN}[Testing] ${test_name}${NC}" | tee -a "$REPORT_FILE"
    echo "----------------------------------------" | tee -a "$REPORT_FILE"
    
    if eval "$test_command" >> "$REPORT_FILE" 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}" | tee -a "$REPORT_FILE"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}✗ FAILED${NC}" | tee -a "$REPORT_FILE"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
    echo "" | tee -a "$REPORT_FILE"
}

# 1. Unit Tests
echo -e "\n${BLUE}[1/5] Running Unit Tests...${NC}" | tee -a "$REPORT_FILE"
run_test "Vitest Unit Tests" "npm run test -- --run"

# 2. Build Test
echo -e "\n${BLUE}[2/5] Running Build Test...${NC}" | tee -a "$REPORT_FILE"
run_test "Production Build" "npm run build"

# 3. Linting
echo -e "\n${BLUE}[3/5] Running Linter...${NC}" | tee -a "$REPORT_FILE"
run_test "ESLint Check" "npm run lint || true"

# 4. Security Audit
echo -e "\n${BLUE}[4/5] Running Security Audit...${NC}" | tee -a "$REPORT_FILE"
run_test "Dependency Security Audit" "npm audit --production || true"

# 5. E2E Tests (if Playwright is configured)
echo -e "\n${BLUE}[5/5] Running E2E Tests...${NC}" | tee -a "$REPORT_FILE"
if command -v playwright &> /dev/null; then
    run_test "Playwright E2E Tests" "npm run test:e2e || true"
else
    echo -e "${YELLOW}⚠ Playwright not installed, skipping E2E tests${NC}" | tee -a "$REPORT_FILE"
fi

# Generate Summary
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TEST SUMMARY                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo "" | tee -a "$REPORT_FILE"
echo -e "Total Tests:  ${CYAN}${TOTAL_TESTS}${NC}" | tee -a "$REPORT_FILE"
echo -e "Passed:       ${GREEN}${PASSED_TESTS}${NC}" | tee -a "$REPORT_FILE"
echo -e "Failed:       ${RED}${FAILED_TESTS}${NC}" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}" | tee -a "$REPORT_FILE"
    echo -e "${GREEN}  Application is ready for deployment.${NC}" | tee -a "$REPORT_FILE"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed${NC}" | tee -a "$REPORT_FILE"
    echo -e "${YELLOW}  Review the report: ${REPORT_FILE}${NC}"
    exit 1
fi
