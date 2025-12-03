# CoinBox Vercel Deployment Guide

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- GitHub repository pushed to GitHub
- Firebase project with credentials

---

## Step 1: Push Your Code to GitHub

```bash
# Make sure all changes are committed
git status

# Push to GitHub (if not already done)
git push origin main
```

---

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
cd /workspaces/coinbox-ai
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N** (first time)
- Project name? **coinbox-ai** (or your choice)
- Directory? **./** (press Enter)
- Override settings? **N**

4. **Set Environment Variables** (after first deployment):
```bash
# Add Firebase config
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID

# Add Paystack keys
vercel env add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
vercel env add PAYSTACK_SECRET_KEY

# Add Firebase Admin
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_PRIVATE_KEY
```

For each command, paste the value when prompted and select environment (production, preview, development).

5. **Deploy to Production**:
```bash
vercel --prod
```

### Option B: Using Vercel Dashboard

1. **Go to Vercel Dashboard**:
   - Visit https://vercel.com/new
   - Click "Import Project"

2. **Import Git Repository**:
   - Click "Import Git Repository"
   - Authorize Vercel to access your GitHub
   - Select your `coinbox-ai` repository

3. **Configure Project**:
   - **Project Name**: `coinbox-ai`
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

4. **Add Environment Variables**:
   Click "Environment Variables" and add:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBI_RyGAlZi5NSYFKmIZjYVV7u4Seb96dg
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=coinbox-connect.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=coinbox-connect
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=coinbox-connect.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=77875988310
   NEXT_PUBLIC_FIREBASE_APP_ID=1:77875988310:web:2caf720b0fa30fc562f8f7
   
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_01b8360fcf741e6947b8ae55c51034e1d16cfac3
   PAYSTACK_SECRET_KEY=sk_test_d3b31fb17c4586a72e280ce0602b19e0b9942601
   
   FIREBASE_PROJECT_ID=coinbox-connect
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@coinbox-connect.iam.gserviceaccount.com
   ```

   **Important**: For `FIREBASE_PRIVATE_KEY`, you'll need to:
   - Open `secrets/firebase-admin.json`
   - Copy the `private_key` value
   - Paste it including the quotes and `\n` characters
   - Or paste the entire JSON file contents

5. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete

---

## Step 3: Configure Firebase for Production

1. **Add Vercel Domain to Firebase**:
   - Go to Firebase Console → Authentication → Settings
   - Under "Authorized domains", add your Vercel domain:
     - `your-project.vercel.app`
     - `www.your-project.vercel.app`
     - Any custom domains you plan to use

2. **Update Firestore Security Rules** (if needed):
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## Step 4: Test Your Deployment

1. **Visit Your Site**:
   - Vercel will provide a URL like `https://coinbox-ai.vercel.app`
   - Test auth flows: `/auth`, `/auth/signup`
   - Test dashboard: `/dashboard`
   - Test admin features (if admin user)

2. **Check Logs**:
   ```bash
   vercel logs
   ```

---

## Step 5: Set Up Custom Domain (Optional)

### Using Vercel Dashboard:

1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### Using CLI:

```bash
vercel domains add yourdomain.com
```

---

## Environment Variables Reference

### Required for All Environments:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | `project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | `1:123:web:abc` |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack Public Key | `pk_test_...` or `pk_live_...` |
| `PAYSTACK_SECRET_KEY` | Paystack Secret Key | `sk_test_...` or `sk_live_...` |
| `FIREBASE_PROJECT_ID` | Firebase Admin Project ID | Same as above |
| `FIREBASE_CLIENT_EMAIL` | Firebase Service Account Email | `firebase-adminsdk@...` |
| `FIREBASE_PRIVATE_KEY` | Firebase Private Key | Full key from JSON |

---

## Troubleshooting

### Build Fails

**Issue**: Build fails with TypeScript errors
**Solution**: 
```bash
npm run build  # Test locally first
npm run type-check  # Check for type errors
```

### Authentication Not Working

**Issue**: Users can't sign in on production
**Solution**:
1. Check Firebase Authorized Domains include your Vercel domain
2. Verify all `NEXT_PUBLIC_FIREBASE_*` env vars are set
3. Check browser console for CORS errors

### Environment Variables Not Loading

**Issue**: App shows "Firebase not initialized"
**Solution**:
1. Verify env vars are set in Vercel dashboard
2. Make sure you selected "Production" environment
3. Redeploy after adding env vars:
   ```bash
   vercel --prod
   ```

### Private Key Issues

**Issue**: Firebase Admin fails with "Invalid private key"
**Solution**:
- Copy the ENTIRE private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep all `\n` characters intact
- Or use the entire firebase-admin.json as `FIREBASE_SERVICE_ACCOUNT` variable

---

## Post-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Firebase Authorized Domains updated
- [ ] Auth flows tested (sign up, sign in, password reset)
- [ ] Dashboard accessible for authenticated users
- [ ] Admin features accessible for admin users
- [ ] Payment flow tested (Paystack)
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring/analytics enabled
- [ ] Error tracking configured (optional: Sentry)

---

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:
- **Push to `main`**: Deploys to production
- **Push to other branches**: Creates preview deployments

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will automatically rebuild and deploy!

---

## Production Best Practices

1. **Switch to Production Keys**:
   - Use Paystack `pk_live_*` and `sk_live_*` keys
   - Update Firebase to production project (if using separate dev/prod)

2. **Enable Monitoring**:
   - Use Vercel Analytics
   - Set up error tracking (Sentry recommended)
   - Monitor Firebase usage

3. **Security**:
   - Review Firestore security rules
   - Enable Firebase App Check
   - Set up rate limiting for API routes

4. **Performance**:
   - Enable Vercel Edge Caching
   - Configure CDN for static assets
   - Monitor Core Web Vitals

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Firebase Docs**: https://firebase.google.com/docs

Need help? Check deployment logs:
```bash
vercel logs --follow
```
