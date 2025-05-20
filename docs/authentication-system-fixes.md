# CoinBox Authentication System

This document provides an overview of the CoinBox authentication system and summarizes the recent fixes implemented.

## Overview

The CoinBox authentication system is built on Firebase Authentication with additional security layers and features:

1. **Multi-Factor Authentication (MFA)**: SMS-based second factor for enhanced security
2. **Security Monitoring**: Real-time monitoring of authentication events via WebSockets
3. **Admin Panel**: Administrative interface for user management and security monitoring
4. **Secure API Routes**: Server-side authentication handling for critical operations

## Recent Fixes

### 1. Fixed Server/Client Code Separation

- Created `/workspaces/coinbox-ai/src/lib/firebase-admin-browser.ts` with browser-safe stubs
- Updated code to use dynamic imports for server-only modules
- Fixed environment detection with `typeof window === 'undefined'`

### 2. WebSocket Server Configuration

- Created `/workspaces/coinbox-ai/src/lib/webhook-monitoring.js`
- Implemented automatic port selection to avoid conflicts
- Added proper error handling for WebSocket initialization

### 3. Node.js Module Polyfills

- Updated next.config.js with proper polyfills for browser environment
- Added transpilePackages configuration for Firebase modules

### 4. Auth Provider Structure

- Fixed import path in _app.tsx to use '@/components/AuthProvider'
- Ensured proper component structure for both auth and non-auth pages

## Browser Polyfills

To make the authentication system work correctly in the browser environment, we need to provide polyfills for Node.js core modules that are referenced in Firebase and other libraries but not available in the browser.

### Required Polyfill Packages

The following packages need to be installed as dev dependencies:

```bash
npm install --save-dev \
  crypto-browserify \
  stream-browserify \
  stream-http \
  https-browserify \
  browserify-zlib \
  path-browserify \
  os-browserify \
  buffer \
  process \
  assert \
  util
```

We've created a helper script that installs all these packages:

```bash
./scripts/install-polyfills.sh
```

### Next.js Configuration

The `next.config.js` file has been updated to handle these polyfills gracefully:

1. Each polyfill is loaded conditionally with try/catch blocks
2. If a polyfill is missing, a false fallback is provided
3. Console warnings are displayed for missing polyfills

If you encounter errors related to missing Node.js modules in the browser, check:
1. That all polyfill packages are installed
2. That the next.config.js webpack configuration is properly set up
3. That the module is properly handled in the fallback configuration

## Dependency Management

### Firebase Admin Version Compatibility

We've downgraded Firebase Admin from v12.3.0 to v11.11.1 to ensure compatibility with langchain@0.0.196, which has a peer dependency requirement of firebase-admin@^11.9.0.

This change ensures that:

1. All Firebase Admin functionality continues to work properly
2. Langchain integration functions correctly without dependency conflicts
3. The application builds and runs without npm dependency resolution errors

If you're experiencing dependency conflicts related to Firebase Admin and Langchain, please ensure you're using the versions specified in package.json.

```json
"dependencies": {
  "firebase": "10.12.4",
  "firebase-admin": "11.11.1",
  "langchain": "0.0.196"
}
```

### Potential Issues

If you encounter any issues with the downgraded Firebase Admin version:

1. Check for breaking changes between v11 and v12
2. Consider using `--legacy-peer-deps` if you need to use the newer version for specific features
3. Update any Firebase Admin code to be compatible with the v11.x.x API

## Architecture

### Client-Side Authentication (Browser)

- `AuthProvider.tsx`: Main authentication context provider
- `MfaEnrollment.tsx` / `MfaVerification.tsx`: MFA components
- `login/page.tsx` and other auth UI pages

### Server-Side Authentication (Node.js)

- `firebase-admin.ts`: Server-side Firebase Admin SDK initialization
- API routes in `src/app/api/auth/` for secure operations
- Webhook handling and security monitoring

### Shared Code with Environment Detection

Files that need to work in both environments use environment detection:

```typescript
if (typeof window === 'undefined') {
  // Server-side only code
} else {
  // Client-side code
}
```

## Testing

To test the authentication system, run:

```bash
$ scripts/run-auth-tests.sh
```

This will:
1. Check API endpoints
2. Test WebSocket connection
3. Verify Firebase imports in Node.js environment

## Security Considerations

- Server-side operations like user creation should only be done in API routes
- Firebase Admin SDK should never be exposed to the client
- Authentication state should be verified on both client and server
- All security events should be logged for audit purposes

## Common Issues

1. **Firebase Admin in Browser**: If you see "Error: The default Firebase app does not exist" in browser, check for server-only code running on the client.

2. **WebSocket Port Conflicts**: If port 9005 is in use, the system will automatically try higher port numbers.

3. **Missing Node.js Modules**: If you see errors about 'crypto', 'stream', etc., check Next.js polyfill configuration.

## Next Steps

1. Test authentication flow with real users
2. Implement comprehensive security logging
3. Add rate limiting for login attempts
4. Enhance admin security monitoring
