# Authentication System Tests

This directory contains scripts for testing the CoinBox authentication system functionality.

## Available Scripts

### `run-auth-tests.sh`

This script runs all authentication tests to verify that the system is working correctly.

Usage:
```bash
./run-auth-tests.sh
```

The tests check:
1. API endpoints are responding correctly
2. WebSocket connection is working
3. Firebase imports work properly in Node.js environment

### `test-auth-system.js`

This is the main test script that runs the authentication tests.

## Prerequisites

Before running the tests, make sure:

1. All polyfill packages are installed:
   ```bash
   ./scripts/install-polyfills.sh
   ```

2. The development server is running:
   ```bash
   npm run dev
   ```

## Troubleshooting

If you encounter any issues while running the tests:

1. **Module not found errors**: Run `./scripts/install-polyfills.sh` to ensure all necessary packages are installed.

2. **WebSocket connection failed**: Check if port 9005 (or the port shown in your console) is already in use.

3. **API endpoint test failed**: Ensure the development server is running and accessible.

## Additional Resources

- [Authentication System Fixes Documentation](../docs/authentication-system-fixes.md)
- [Administrator Authentication Guide](../docs/admin-authentication-guide.md)
- [User MFA Guide](../docs/user-mfa-guide.md)
