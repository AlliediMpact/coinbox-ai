#!/bin/bash
# filepath: /workspaces/coinbox-ai/scripts/run-security-tests.sh

# Script to run security-related tests for Allied iMpact Coin Box

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Allied iMpact Coin Box Security Testing =====${NC}"
echo "Running security component tests..."

# Install dependencies if needed
if ! npm list vitest &>/dev/null; then
  echo -e "${YELLOW}Installing test dependencies...${NC}"
  npm install
fi

# Run the tests with coverage
echo -e "${BLUE}Running transaction monitoring tests...${NC}"
npx vitest run src/tests/transaction-monitoring.test.ts --coverage

echo -e "${BLUE}Running rate limiting tests...${NC}"
npx vitest run src/tests/trading-rate-limit.test.ts

echo -e "${BLUE}Running security UI tests...${NC}"
npx vitest run src/tests/transaction-security-ui.test.tsx src/tests/admin-transaction-monitoring.test.tsx

echo -e "${GREEN}Security test suite completed${NC}"
