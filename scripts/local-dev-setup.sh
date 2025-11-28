#!/bin/bash

##############################################################################
# Local Development Setup & Testing Script
# Helps run the CoinBox AI platform locally with all features
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     CoinBox AI - Local Development Setup                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check Node.js version
echo -e "${CYAN}[1/8] Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✓${NC} Node.js version: $(node -v)"
else
    echo -e "${RED}✗${NC} Node.js version too old. Required: 18+, Found: $(node -v)"
    exit 1
fi

# Check if dependencies are installed
echo -e "\n${CYAN}[2/8] Checking dependencies...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Installing dependencies..."
    npm install
fi

# Check environment configuration
echo -e "\n${CYAN}[3/8] Checking environment configuration...${NC}"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local exists"
    
    # Check for Firebase configuration
    if grep -q "NEXT_PUBLIC_FIREBASE_API_KEY" .env.local && grep -q "coinbox-connect" .env.local; then
        echo -e "${GREEN}✓${NC} Firebase client configuration found"
    else
        echo -e "${YELLOW}⚠${NC} Firebase client configuration incomplete"
    fi
    
    # Check for Firebase Admin (optional for UI-only mode)
    if [ -f "secrets/firebase-admin.json" ] || [ ! -z "$FIREBASE_PRIVATE_KEY" ]; then
        echo -e "${GREEN}✓${NC} Firebase Admin credentials available"
    else
        echo -e "${YELLOW}⚠${NC} Firebase Admin not configured - running in UI-only mode"
        echo -e "${YELLOW}  Backend features (auth, database) will not work${NC}"
        echo -e "${YELLOW}  To enable: Add Firebase service account to secrets/firebase-admin.json${NC}"
    fi
else
    echo -e "${YELLOW}⚠${NC} .env.local not found, copying from .env.example"
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo -e "${YELLOW}  Please update .env.local with your credentials${NC}"
    fi
fi

# Check if port 9004 is available
echo -e "\n${CYAN}[4/8] Checking if port 9004 is available...${NC}"
if lsof -Pi :9004 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}✗${NC} Port 9004 is already in use"
    echo -e "${YELLOW}  Killing process on port 9004...${NC}"
    kill -9 $(lsof -t -i:9004) 2>/dev/null || true
    sleep 2
fi
echo -e "${GREEN}✓${NC} Port 9004 is available"

# Check WebSocket port (9007)
echo -e "\n${CYAN}[5/8] Checking WebSocket port (9007)...${NC}"
if lsof -Pi :9007 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} Port 9007 is in use, killing process..."
    kill -9 $(lsof -t -i:9007) 2>/dev/null || true
    sleep 1
fi
echo -e "${GREEN}✓${NC} Port 9007 is available"

# Build the application (optional, for checking build errors)
echo -e "\n${CYAN}[6/8] Quick build check...${NC}"
echo -e "${YELLOW}  This may take 30-60 seconds...${NC}"
if timeout 120 npm run build > /tmp/build.log 2>&1; then
    echo -e "${GREEN}✓${NC} Build successful"
else
    echo -e "${YELLOW}⚠${NC} Build check skipped or timed out"
    echo -e "${YELLOW}  Development server will build on-demand${NC}"
fi

# Start the development server
echo -e "\n${CYAN}[7/8] Starting development server...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Starting Next.js development server on port 9004...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}Server will start in a few seconds...${NC}"
echo ""
echo -e "${GREEN}Access the application at:${NC}"
echo -e "  ${CYAN}➜${NC}  Local:   ${YELLOW}http://localhost:9004${NC}"
echo ""
echo -e "${GREEN}Available features:${NC}"
echo -e "  ${CYAN}•${NC} User Interface (always available)"
echo -e "  ${CYAN}•${NC} Client-side Firebase Auth"
echo -e "  ${CYAN}•${NC} Payment UI (Paystack integration)"
echo -e "  ${CYAN}•${NC} Trading interface"
echo ""

if [ -f "secrets/firebase-admin.json" ] || [ ! -z "$FIREBASE_PRIVATE_KEY" ]; then
    echo -e "${GREEN}Backend features enabled:${NC}"
    echo -e "  ${CYAN}•${NC} Server-side authentication"
    echo -e "  ${CYAN}•${NC} Database operations"
    echo -e "  ${CYAN}•${NC} Payment processing"
    echo -e "  ${CYAN}•${NC} Admin panel"
else
    echo -e "${YELLOW}Backend features disabled (Firebase Admin not configured)${NC}"
    echo -e "${YELLOW}To enable backend:${NC}"
    echo -e "  1. Download Firebase service account JSON"
    echo -e "  2. Save as: secrets/firebase-admin.json"
    echo -e "  3. Restart server"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Press Ctrl+C to stop the server${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Export port
export PORT=9004

# Start the server
npm run dev
