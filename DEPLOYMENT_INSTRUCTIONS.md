# 🚀 CoinBox Production Deployment Guide

## Current Status
✅ All authentication and dashboard protection fixes committed  
✅ Firebase initialization working correctly  
✅ All forms and CTAs functioning  
✅ Development server running on port 9004  

---

## Part 1: YOUR ACTIONS (Required Before Deployment)

### Step 1: Push Latest Changes to GitHub

```bash
cd /workspaces/coinbox-ai

# Verify all changes are committed
git status

# Push to GitHub (you're 4 commits ahead)
git push origin main
```

**Expected output:** `Everything up-to-date` or successful push message.

---

### Step 2: Set Up Vercel Account

1. **Go to:** https://vercel.com/signup
2. **Sign up with GitHub** (recommended)
3. **Authorize Vercel** to access your GitHub repositories

---

### Step 3: Import Your Project to Vercel

1. In Vercel Dashboard, click **"Add New"** → **"Project"**
2. Select your GitHub repository: `AlliediMpact/coinbox-ai`
3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `npm run build` (leave default)
   - **Output Directory:** `.next` (leave default)
   - **Install Command:** `npm install` (leave default)

4. **DO NOT DEPLOY YET!** Click **"Environment Variables"** first

---

### Step 4: Add Environment Variables in Vercel

In the **Environment Variables** section, add these one by one:

#### Firebase Public Variables (All Environments: Production, Preview, Development)

```
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyBI_RyGAlZi5NSYFKmIZjYVV7u4Seb96dg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = coinbox-connect.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = coinbox-connect
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = coinbox-connect.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 77875988310
NEXT_PUBLIC_FIREBASE_APP_ID = 1:77875988310:web:2caf720b0fa30fc562f8f7
NEXT_PUBLIC_FIREBASE_DATABASE_URL = https://coinbox-connect.firebaseio.com
```

#### Firebase Admin SDK (Production & Preview only)

```
FIREBASE_PROJECT_ID = coinbox-connect
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@coinbox-connect.iam.gserviceaccount.com
```

**For FIREBASE_PRIVATE_KEY:**
- Open your Firebase service account JSON file at: `./secrets/firebase-admin.json`
- Copy the `private_key` value (including the quotes and `\n` characters)
- Paste it exactly as-is in Vercel

Example format:
```
FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqh...\n-----END PRIVATE KEY-----\n"
```

#### Paystack Configuration (Production & Preview)

```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = pk_test_01b8360fcf741e6947b8ae55c51034e1d16cfac3
PAYSTACK_SECRET_KEY = sk_test_d3b31fb17c4586a72e280ce0602b19e0b9942601
```

**Note:** Change to live keys when ready for production payments!

#### Application Configuration (All Environments)

```
NEXT_PUBLIC_APP_URL = https://your-vercel-app.vercel.app
NODE_ENV = production
NEXT_PUBLIC_ENVIRONMENT = production
```

**Replace `your-vercel-app`** with your actual Vercel project name (you'll see it after deployment).

#### Security Secrets (Production & Preview)

Generate these secrets by running in your terminal:

```bash
node -e "console.log('CRON_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('AUTH_SECRET_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated values and add them:

```
CRON_SECRET = <your-generated-secret>
AUTH_SECRET_KEY = <your-generated-secret>
AUTH_SESSION_EXPIRES_IN = 7d
```

---

### Step 5: Deploy!

1. After adding all environment variables, click **"Deploy"**
2. Wait 2-5 minutes for the build to complete
3. Watch the deployment logs for any errors

**Expected outcome:** ✅ "Your project is ready!" message

---

### Step 6: Get Your Production URL

After deployment completes:
1. Copy your Vercel URL (e.g., `https://coinbox-ai.vercel.app`)
2. **Go back to Environment Variables** in Vercel
3. **Update** `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
4. Trigger a new deployment by going to **Deployments** → **...** menu → **Redeploy**

---

## Part 2: VERIFICATION TESTS (Do These After Deployment)

### Test 1: Home Page Loading

```
✓ Visit: https://your-app.vercel.app
✓ Expected: Home page loads with no errors
✓ Check: All CTAs are clickable (Sign Up, Sign In buttons)
✓ Check: Logo redirects to home page
```

### Test 2: Authentication Pages

```
✓ Visit: https://your-app.vercel.app/auth
✓ Expected: Sign-in page loads instantly (no infinite spinner)
✓ Test login with: user.investor@test.coinbox.local / UserInvestor123!
✓ Expected: Redirects to dashboard

✓ Visit: https://your-app.vercel.app/auth/signup
✓ Expected: Sign-up form loads and wizard works
✓ Fill form and test (optional - will require Paystack payment)
```

### Test 3: Dashboard Protection

```
✓ Open incognito/private window
✓ Visit: https://your-app.vercel.app/dashboard
✓ Expected: Redirects to /auth (not stuck loading)

✓ Log in with test credentials
✓ Visit: https://your-app.vercel.app/dashboard
✓ Expected: Dashboard loads with sidebar, header, balances
```

### Test 4: Protected Routes

```
✓ Test these URLs while logged in:
  - /dashboard/trading ✓
  - /dashboard/wallet ✓
  - /dashboard/transactions ✓
  - /dashboard/security ✓
  - /dashboard/profile ✓

✓ Expected: All pages load without errors
```

### Test 5: Admin Routes (if logged in as admin)

```
✓ Log in with: admin.main@test.coinbox.local / AdminMain123!
✓ Visit: /dashboard/admin
✓ Expected: Admin dashboard loads
✓ Check sidebar shows "Admin Tools" section
```

---

## Part 3: POST-DEPLOYMENT TASKS

### Update Firebase Console Settings

1. Go to: https://console.firebase.google.com
2. Select your project: `coinbox-connect`
3. Navigate to: **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel domain: `your-app.vercel.app`
5. Click **Add domain**

### Configure Paystack Webhook (Optional, for production)

1. Go to: https://dashboard.paystack.com/#/settings/developer
2. Add webhook URL: `https://your-app.vercel.app/api/webhooks/paystack`
3. Subscribe to events: `charge.success`, `subscription.create`

### Set Up Custom Domain (Optional)

1. In Vercel Dashboard → **Domains**
2. Add your custom domain (e.g., `coinbox.com`)
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` environment variable

---

## Common Issues & Solutions

### Issue: Build fails with "Module not found"

**Solution:**
```bash
# In your local terminal:
cd /workspaces/coinbox-ai
npm install
npm run build  # Test locally first

# If successful, commit and push
git add package-lock.json
git commit -m "Update dependencies"
git push origin main
```

### Issue: Environment variables not working

**Solution:**
- Check for typos in variable names
- Ensure `NEXT_PUBLIC_` prefix for client-side vars
- Redeploy after adding/changing variables
- Clear Vercel cache: Deployments → ... → Redeploy with cache cleared

### Issue: Firebase not initializing

**Solution:**
- Verify all Firebase env vars are set
- Check `FIREBASE_PRIVATE_KEY` has correct escaping
- Ensure authorized domain is added in Firebase Console

### Issue: Authentication redirects not working

**Solution:**
- Verify `NEXT_PUBLIC_APP_URL` matches your actual Vercel URL
- Check Firebase authorized domains include your Vercel domain
- Clear browser cache and cookies

---

## Monitoring & Logs

### View Deployment Logs
1. Vercel Dashboard → **Deployments**
2. Click on latest deployment
3. View **Build Logs** and **Function Logs**

### Check Runtime Errors
1. Vercel Dashboard → **Logs**
2. Filter by severity: Errors
3. Check recent requests

### Monitor Performance
1. Vercel Dashboard → **Analytics**
2. Check page load times
3. Monitor API route performance

---

## Rollback Procedure

If something goes wrong:

1. **Quick rollback in Vercel:**
   - Dashboard → **Deployments**
   - Find previous working deployment
   - Click **...** → **Promote to Production**

2. **Or revert via Git:**
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## Next Steps After Successful Deployment

1. ✅ Test all features thoroughly
2. ✅ Update team about new production URL
3. ✅ Configure monitoring and alerts
4. ✅ Set up domain (if using custom domain)
5. ✅ Switch Paystack to live keys (for real payments)
6. ✅ Create user documentation
7. ✅ Plan Sprint 2 features

---

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review this guide's "Common Issues" section
3. Check Firebase Console for errors
4. Test locally first with `npm run build && npm start`

**You're ready to deploy! 🚀**

---

**Last Updated:** December 3, 2025  
**Deployment Platform:** Vercel  
**Framework:** Next.js 14.2.32  
**Node Version:** 20.x (Vercel default)
