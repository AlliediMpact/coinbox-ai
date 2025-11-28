# 🚀 CoinBox AI - Local Development Guide

**Last Updated:** November 28, 2024  
**Status:** Tested and Verified ✅

---

## Quick Start (2 Minutes)

```bash
# Option 1: Automated Setup (Recommended)
./scripts/local-dev-setup.sh

# Option 2: Manual Setup
npm install
PORT=9004 npm run dev
```

**Access the app:** http://localhost:9004

---

## System Requirements

### Required:
- **Node.js:** 18.0.0 or higher (tested with v22.21.1)
- **npm:** 9.0.0 or higher
- **Memory:** 4GB RAM minimum
- **Disk Space:** 2GB free space

### Optional (for full backend features):
- Firebase Admin SDK credentials
- Paystack API keys (test mode available)
- SMTP credentials for emails

---

## Environment Configuration

### Development Mode (UI Only)

The app runs in UI-only mode without Firebase Admin credentials. This lets you:
- ✅ View all UI components
- ✅ Test navigation and layouts
- ✅ Review design and user experience
- ❌ Cannot test authentication
- ❌ Cannot access database
- ❌ Backend API calls will fail gracefully

### Full Development Mode (All Features)

To enable all features, configure Firebase:

1. **Download Firebase Service Account**:
   ```bash
   # From Firebase Console:
   # Project Settings > Service Accounts > Generate New Private Key
   
   # Save as:
   mkdir -p secrets
   mv ~/Downloads/serviceAccountKey.json secrets/firebase-admin.json
   ```

2. **Update .env.local**:
   ```env
   # Firebase Client (for frontend)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   
   # Firebase Admin (for backend)
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY_PATH=./secrets/firebase-admin.json
   FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
   
   # Paystack (use test keys)
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
   PAYSTACK_SECRET_KEY=sk_test_xxxxx
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:9004
   NODE_ENV=development
   ```

3. **Restart the server**:
   ```bash
   npm run dev
   ```

---

## Available Scripts

### Development:
```bash
# Start development server
npm run dev                  # Port 9004

# Start with automatic setup
./scripts/local-dev-setup.sh

# Build for production
npm run build

# Start production server
npm start
```

### Testing:
```bash
# Run all unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run comprehensive test suite
./scripts/run-all-tests.sh
```

### Code Quality:
```bash
# Lint code
npm run lint

# Security audit
npm audit

# Pre-deployment check
./scripts/pre-deployment-check.sh
```

---

## Viewing the Application

### Homepage
- **URL:** http://localhost:9004
- **Features:** Hero image, navigation, feature overview
- **Authentication:** Required for full access

### Key Routes:

#### Public Routes (No Auth Required):
- `/` - Homepage
- `/auth/signin` - Sign in page
- `/auth/signup` - Registration flow
- `/auth/error` - Error handling

#### Protected Routes (Auth Required):
- `/dashboard` - User dashboard
- `/trading` - P2P trading interface
- `/wallet` - Wallet management
- `/profile` - User profile
- `/kyc` - KYC verification
- `/referrals` - Referral tracking

#### Admin Routes (Admin Role Required):
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/transactions` - Transaction monitoring
- `/admin/kyc` - KYC approvals

---

## Testing Features

### 1. UI Testing (No Backend Required)

```bash
# Start server
npm run dev

# Open browser to http://localhost:9004
# Navigate through all pages
# Check responsive design (mobile, tablet, desktop)
```

**What to Test:**
- ✅ All pages load without errors
- ✅ Navigation works correctly
- ✅ Forms display properly
- ✅ Responsive design on different screen sizes
- ✅ Images and icons load
- ✅ Color scheme and branding consistent

### 2. Authentication Testing (Requires Firebase)

```bash
# Ensure Firebase is configured
# Start server
npm run dev
```

**Test Flow:**
1. Go to `/auth/signup`
2. Create test account
3. Verify email (check console logs for link)
4. Sign in at `/auth/signin`
5. Access protected routes
6. Test logout

**Expected Behavior:**
- ✅ Registration creates user account
- ✅ Email verification sent
- ✅ Login redirects to dashboard
- ✅ Protected routes accessible
- ✅ Logout clears session

### 3. Payment Flow Testing (Requires Paystack)

```bash
# Use test keys in .env.local:
# NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
```

**Test Flow:**
1. Sign in as user
2. Go to membership selection
3. Select a tier (e.g., Basic - R550)
4. Click "Pay Now"
5. Use Paystack test cards:
   - Success: `4084084084084081`
   - Decline: `5060666666666666666`

**Expected Behavior:**
- ✅ Payment modal opens
- ✅ Test card processes correctly
- ✅ Success redirects to dashboard
- ✅ Membership tier updated
- ✅ Receipt generated

### 4. Trading System Testing

**Test Flow:**
1. Sign in as user
2. Navigate to trading page
3. Create "Invest" ticket
4. Create "Borrow" ticket
5. Check matching algorithm
6. Test escrow flow

**Expected Behavior:**
- ✅ Tickets created successfully
- ✅ Matching works automatically
- ✅ Escrow holds funds
- ✅ Completion releases funds
- ✅ Interest calculated correctly

### 5. Admin Panel Testing

**Test Flow:**
1. Sign in as admin user
2. Navigate to `/admin`
3. Test user management
4. Test KYC approvals
5. Test transaction monitoring

**Expected Behavior:**
- ✅ Admin dashboard loads
- ✅ User list displays
- ✅ KYC queue shows pending items
- ✅ Transactions are visible
- ✅ Search and filters work

---

## Common Issues & Solutions

### Issue 1: Port Already in Use
```bash
Error: Port 9004 is already in use
```

**Solution:**
```bash
# Kill process on port 9004
lsof -ti:9004 | xargs kill -9

# Or use different port
PORT=3000 npm run dev
```

### Issue 2: Firebase Admin Not Initialized
```bash
Warning: Firebase Admin SDK not initialized
```

**Solution:**
This is normal in UI-only mode. To enable backend:
1. Add Firebase service account to `secrets/firebase-admin.json`
2. Update `.env.local` with correct paths
3. Restart server

### Issue 3: Build Fails
```bash
Error: Module not found
```

**Solution:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Issue 4: Tests Failing
```bash
Tests: X failed, Y passed
```

**Solution:**
```bash
# Update snapshots if UI changed
npm run test -- -u

# Check specific test file
npm run test -- src/components/YourComponent.test.tsx
```

### Issue 5: WebSocket Error
```bash
WebSocket connection failed
```

**Solution:**
This is normal - WebSocket is for webhook monitoring. App works without it.

---

## Performance Optimization Tips

### Development Mode:
```bash
# Disable type checking (faster builds)
export TSC_COMPILE_ON_ERROR=true
npm run dev

# Use faster package manager
npm install -g pnpm
pnpm install
pnpm dev
```

### Testing Mode:
```bash
# Run specific tests only
npm run test -- ComponentName

# Skip coverage for faster runs
npm run test -- --coverage=false
```

---

## Project Structure

```
coinbox-ai/
├── src/
│   ├── app/              # Next.js 13 app router
│   │   ├── api/          # API routes
│   │   ├── auth/         # Auth pages
│   │   └── page.tsx      # Homepage
│   ├── components/       # React components
│   ├── lib/              # Utility libraries
│   │   ├── firebase-admin.ts    # Backend Firebase
│   │   ├── production-logger.ts # Logging
│   │   └── paystack-service.ts  # Payments
│   └── middleware/       # API middleware
├── scripts/              # Helper scripts
├── public/               # Static assets
├── tests/                # Test files
└── docs/                 # Documentation
```

---

## Security Best Practices

### During Development:

1. **Never Commit Secrets:**
   ```bash
   # Check .gitignore includes:
   .env.local
   .env.production
   secrets/
   ```

2. **Use Test API Keys:**
   - Paystack: Use `pk_test_` and `sk_test_` keys
   - Never use production keys in development

3. **Rotate Credentials:**
   - Change all API keys before production
   - Use different Firebase projects for dev/prod

4. **Monitor Console:**
   - Watch for security warnings
   - Check for exposed sensitive data in logs

---

## Debugging Tools

### Browser DevTools:
```javascript
// Check Redux state (if using)
window.__REDUX_DEVTOOLS_EXTENSION__

// Check Firebase connection
firebase.apps

// Monitor API calls
// Network tab > Filter: XHR
```

### VS Code Extensions:
- ESLint
- Prettier
- Firebase Explorer
- Thunder Client (API testing)

### Chrome Extensions:
- React Developer Tools
- Redux DevTools
- Firebase Debugger

---

## Next Steps

### For Viewing UI:
1. ✅ Run `npm run dev`
2. ✅ Open http://localhost:9004
3. ✅ Navigate through pages
4. ✅ Test responsive design

### For Full Testing:
1. ✅ Configure Firebase credentials
2. ✅ Add Paystack test keys
3. ✅ Run `./scripts/run-all-tests.sh`
4. ✅ Test all features manually

### For Production Deployment:
1. ✅ Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. ✅ Check [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md)
3. ✅ Run `./scripts/pre-deployment-check.sh`
4. ✅ Deploy to hosting platform

---

## Getting Help

### Documentation:
- [README.md](./README.md) - Project overview
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment
- [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) - Security analysis
- [PRODUCTION_READINESS_REPORT.md](./PRODUCTION_READINESS_REPORT.md) - Readiness checklist

### Resources:
- Next.js Docs: https://nextjs.org/docs
- Firebase Docs: https://firebase.google.com/docs
- Paystack Docs: https://paystack.com/docs

### Support:
- Check existing documentation first
- Review error logs in console
- Use browser DevTools for debugging

---

**Happy Coding! 🚀**

If you encounter any issues not covered here, check the main documentation or review the error logs.
