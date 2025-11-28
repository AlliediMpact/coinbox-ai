#!/bin/bash

##############################################################################
# Pre-Deployment Checklist Script
# Validates environment and configuration before production deployment
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     CoinBox AI - Pre-Deployment Checklist                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

check_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 1. Check Node.js version
echo -e "\n${BLUE}[1/12] Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    check_pass "Node.js version: $(node -v)"
else
    check_fail "Node.js version too old. Required: 18+, Found: $(node -v)"
fi

# 2. Check if build succeeds
echo -e "\n${BLUE}[2/12] Testing production build...${NC}"
if npm run build > /dev/null 2>&1; then
    check_pass "Production build succeeds"
else
    check_fail "Production build fails. Run 'npm run build' to see errors"
fi

# 3. Check environment file
echo -e "\n${BLUE}[3/12] Checking environment configuration...${NC}"
if [ -f ".env.production" ]; then
    check_pass ".env.production file exists"
    
    # Check critical variables
    source .env.production 2>/dev/null || true
    
    if [ -z "$PAYSTACK_SECRET_KEY" ] || [[ "$PAYSTACK_SECRET_KEY" == *"YOUR_"* ]]; then
        check_fail "PAYSTACK_SECRET_KEY not set or using placeholder"
    else
        check_pass "Paystack keys configured"
    fi
    
    if [ -z "$FIREBASE_PRIVATE_KEY" ] || [[ "$FIREBASE_PRIVATE_KEY" == *"dummy"* ]]; then
        check_fail "Firebase Admin SDK not properly configured"
    else
        check_pass "Firebase Admin SDK configured"
    fi
    
    if [ "$NODE_ENV" != "production" ]; then
        check_warn "NODE_ENV should be 'production' in .env.production"
    else
        check_pass "NODE_ENV set to production"
    fi
else
    check_fail ".env.production file not found. Copy from .env.production.example"
fi

# 4. Check for test API keys
echo -e "\n${BLUE}[4/12] Checking for test/development keys...${NC}"
if grep -r "pk_test_\|sk_test_" .env.production 2>/dev/null; then
    check_fail "Test API keys found in production config! Use production keys only"
else
    check_pass "No test keys found in production config"
fi

# 5. Run tests
echo -e "\n${BLUE}[5/12] Running test suite...${NC}"
if npm run test > /dev/null 2>&1; then
    TEST_RESULTS=$(npm run test 2>&1 | grep "Test Files" | tail -1)
    check_pass "Tests passing: $TEST_RESULTS"
else
    check_warn "Some tests failing. Review before deployment"
fi

# 6. Check for console.log in API routes
echo -e "\n${BLUE}[6/12] Checking for console.log in API routes...${NC}"
CONSOLE_COUNT=$(grep -r "console\." src/app/api --include="*.ts" | wc -l)
if [ "$CONSOLE_COUNT" -gt 50 ]; then
    check_warn "Found $CONSOLE_COUNT console statements in API routes. Consider using production logger"
else
    check_pass "Console logging looks acceptable ($CONSOLE_COUNT statements)"
fi

# 7. Check Firestore rules exist
echo -e "\n${BLUE}[7/12] Checking Firestore configuration...${NC}"
if [ -f "firestore.rules" ]; then
    check_pass "Firestore security rules file exists"
else
    check_fail "firestore.rules not found. Database will be insecure!"
fi

if [ -f "firestore.indexes.json" ]; then
    check_pass "Firestore indexes file exists"
else
    check_warn "firestore.indexes.json not found. Performance may be affected"
fi

# 8. Check for security files
echo -e "\n${BLUE}[8/12] Checking security configuration...${NC}"
if [ -f "src/lib/production-logger.ts" ]; then
    check_pass "Production logger exists"
else
    check_warn "Production logger not found at src/lib/production-logger.ts"
fi

# 9. Check for backup script
echo -e "\n${BLUE}[9/12] Checking backup system...${NC}"
if [ -f "scripts/backup-firestore.sh" ] && [ -x "scripts/backup-firestore.sh" ]; then
    check_pass "Backup script exists and is executable"
else
    check_warn "Backup script not found or not executable"
fi

# 10. Check dependencies
echo -e "\n${BLUE}[10/12] Checking dependencies...${NC}"
if [ -d "node_modules" ]; then
    check_pass "Dependencies installed"
    
    # Check for security vulnerabilities
    AUDIT_RESULT=$(npm audit --production 2>&1)
    CRITICAL=$(echo "$AUDIT_RESULT" | grep -c "critical" || true)
    HIGH=$(echo "$AUDIT_RESULT" | grep -c "high" || true)
    
    if [ "$CRITICAL" -gt 0 ]; then
        check_fail "Found $CRITICAL critical security vulnerabilities. Run 'npm audit fix'"
    elif [ "$HIGH" -gt 0 ]; then
        check_warn "Found $HIGH high security vulnerabilities. Review with 'npm audit'"
    else
        check_pass "No critical security vulnerabilities found"
    fi
else
    check_fail "Dependencies not installed. Run 'npm install'"
fi

# 11. Check for sensitive files in git
echo -e "\n${BLUE}[11/12] Checking for sensitive files in git...${NC}"
if git ls-files | grep -E "\.env$|\.env\.production$|serviceAccountKey\.json$" > /dev/null 2>&1; then
    check_fail "Sensitive files tracked in git! Review .gitignore"
else
    check_pass "No sensitive files tracked in git"
fi

# 12. Check .gitignore
echo -e "\n${BLUE}[12/12] Checking .gitignore configuration...${NC}"
if grep -q "\.env\.production" .gitignore 2>/dev/null; then
    check_pass ".env.production in .gitignore"
else
    check_warn ".env.production not in .gitignore"
fi

# Summary
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      SUMMARY                               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warnings found. Review before deployment.${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS errors and $WARNINGS warnings found.${NC}"
    echo -e "${RED}Fix errors before deploying to production!${NC}"
    exit 1
fi
