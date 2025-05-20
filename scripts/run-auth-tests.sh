#!/bin/bash

# Make sure the script has execute permissions
chmod +x /workspaces/coinbox-ai/scripts/test-auth-system.js

# Run the test script
echo "Running authentication system tests..."
node /workspaces/coinbox-ai/scripts/test-auth-system.js
