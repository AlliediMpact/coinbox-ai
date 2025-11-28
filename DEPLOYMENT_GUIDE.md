# 🚀 CoinBox AI - Production Deployment Guide

## Quick Start (5 Minutes)

### 1. Fix Applied - Build Now Works ✅

```bash
# Verify build succeeds
npm run build

# Should output: ✓ Compiled successfully
```

### 2. Deploy Firestore Configuration (Critical)

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (one-time)
firebase use --add  # Select your project ID

# Deploy security rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

### 3. Set Up Environment Variables

```bash
# Copy the template
cp .env.production.example .env.production

# Edit and fill in production values
nano .env.production  # or use your preferred editor
```

**Critical Variables to Set:**
- `PAYSTACK_SECRET_KEY` - Use pk_live_... (NOT test keys!)
- `FIREBASE_PRIVATE_KEY` - From Firebase console
- `FIREBASE_PROJECT_ID` - Your Firebase project
- `EMAIL_PASSWORD` - Production SMTP credentials
- `SESSION_SECRET` - Generate: `openssl rand -base64 32`
- `JWT_SECRET` - Generate: `openssl rand -base64 32`

### 4. Run Pre-Deployment Check

```bash
chmod +x scripts/pre-deployment-check.sh
./scripts/pre-deployment-check.sh
```

Fix any errors reported before proceeding.

### 5. Set Up Automated Backups

```bash
# Test backup script
chmod +x scripts/backup-firestore.sh
./scripts/backup-firestore.sh

# Schedule daily backups (cron)
crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * /path/to/coinbox-ai/scripts/backup-firestore.sh >> /path/to/backup.log 2>&1
```

### 6. Deploy to Production

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
# Settings > Environment Variables > Add all from .env.production
```

#### Option B: Custom Server (Node.js)

```bash
# Build for production
npm run build

# Start production server
PORT=3000 npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "coinbox-ai" -- start
pm2 save
pm2 startup
```

#### Option C: Docker

```bash
# Build Docker image
docker build -t coinbox-ai .

# Run container
docker run -d \
  --name coinbox-ai \
  -p 3000:3000 \
  --env-file .env.production \
  coinbox-ai

# Or use docker-compose
docker-compose up -d
```

---

## Post-Deployment Checklist

### Immediate (First Hour)

- [ ] Verify site loads at production URL
- [ ] Test user registration flow
- [ ] Test user login
- [ ] Test payment flow (small amount)
- [ ] Verify email notifications work
- [ ] Check Firestore rules are active (try unauthorized access)
- [ ] Monitor error logs for first issues

### First Day

- [ ] Set up monitoring dashboard
- [ ] Configure uptime alerts
- [ ] Test all critical user flows
- [ ] Verify backup job ran successfully
- [ ] Monitor performance metrics
- [ ] Check for any security alerts

### First Week

- [ ] Review user feedback
- [ ] Analyze performance bottlenecks
- [ ] Optimize slow queries
- [ ] Adjust rate limits if needed
- [ ] Plan first maintenance window

---

## Monitoring Setup

### 1. Error Tracking (Sentry)

```bash
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs

# Add DSN to .env.production
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

### 2. Uptime Monitoring

Sign up for free tier:
- [UptimeRobot](https://uptimerobot.com)
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

Configure:
- URL: https://your-domain.com
- Check interval: 5 minutes
- Alert via: Email + SMS

### 3. Performance Monitoring

Add to your code:

```typescript
// src/lib/monitoring.ts
import { logger } from './production-logger';

export async function trackApiPerformance(
  req: Request,
  res: Response,
  next: Function
) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logApiRequest(
      req.method,
      req.url,
      res.statusCode,
      duration
    );
  });
  
  next();
}
```

---

## Common Issues & Solutions

### Issue: Build fails with "use client" error
**Status:** ✅ FIXED
This was resolved by moving 'use client' directive to line 1 in all page files.

### Issue: Firebase Admin not initialized
**Solution:**
```bash
# Verify environment variables are set
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL

# Check private key format (should have \n for newlines)
echo $FIREBASE_PRIVATE_KEY | head -c 50
```

### Issue: Payments not working
**Checklist:**
- [ ] Using production Paystack keys (pk_live_...)
- [ ] Webhook URL configured in Paystack dashboard
- [ ] Firestore rules allow webhook writes
- [ ] Payment callback route is accessible

### Issue: High error rate
**Steps:**
1. Check error logs: `pm2 logs` or Vercel logs
2. Look for patterns in errors
3. Check database connection
4. Verify environment variables
5. Review recent code changes

### Issue: Slow performance
**Quick fixes:**
1. Add indexes to frequently queried fields
2. Implement caching for static data
3. Optimize images (use Next.js Image component)
4. Enable CDN for static assets
5. Review and optimize slow API endpoints

---

## Rollback Procedure

If deployment fails or critical issues arise:

### Quick Rollback

```bash
# Vercel
vercel rollback

# PM2
pm2 stop coinbox-ai
git reset --hard <previous-commit>
npm run build
pm2 restart coinbox-ai

# Docker
docker stop coinbox-ai
docker run -d --name coinbox-ai <previous-image-tag>
```

### Database Rollback

```bash
# Restore from backup
gcloud firestore import gs://coinbox-backups/firestore-backup-YYYYMMDD_HHMMSS
```

---

## Maintenance Windows

### Planned Maintenance

1. Announce 48 hours in advance
2. Choose low-traffic time (e.g., 2-4 AM local time)
3. Display maintenance page
4. Perform updates
5. Run smoke tests
6. Remove maintenance page
7. Monitor for 30 minutes

### Emergency Maintenance

1. Enable maintenance mode immediately
2. Fix critical issue
3. Deploy fix
4. Run critical tests
5. Resume service
6. Post incident report

---

## Security Incident Response

### If you detect suspicious activity:

1. **Immediate Actions**
   - Review access logs in Firebase Console
   - Check for unusual API usage patterns
   - Verify rate limiting is working
   - Review recent user registrations

2. **Containment**
   - Block suspicious IPs via Firestore rules or WAF
   - Disable affected user accounts
   - Increase logging verbosity
   - Alert team members

3. **Investigation**
   - Export relevant logs
   - Identify attack vector
   - Assess damage/exposure
   - Document findings

4. **Recovery**
   - Patch vulnerability
   - Reset compromised credentials
   - Notify affected users (if required)
   - Update security rules
   - Implement additional monitoring

5. **Post-Incident**
   - Write incident report
   - Update security procedures
   - Conduct team retrospective
   - Implement preventive measures

---

## Support Contacts

### Emergency Escalation
- **Platform Down:** [Emergency contact]
- **Security Breach:** [Security team]
- **Payment Issues:** [Finance team]

### Service Providers
- **Firebase Support:** firebase.google.com/support
- **Paystack Support:** support@paystack.com
- **Vercel Support:** vercel.com/support (if using Vercel)

### On-Call Schedule
Set up rotation using PagerDuty or similar:
- Week 1: [Developer A]
- Week 2: [Developer B]
- Week 3: [Developer C]

---

## Performance Benchmarks

### Target Metrics (First Month)

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Uptime | 99.9% | < 99.5% |
| API Response (p95) | < 500ms | > 2s |
| Error Rate | < 1% | > 5% |
| Payment Success | > 95% | < 90% |
| Page Load (p95) | < 3s | > 5s |

Monitor and adjust based on actual usage.

---

## Cost Optimization

### Month 1 Costs Estimate
- Hosting: $20-50
- Firebase: $25-75
- Email Service: $20
- Monitoring: $25
- **Total: $90-170/month**

### Cost Reduction Tips
1. Use Firebase free tier initially
2. Optimize expensive queries
3. Implement caching aggressively
4. Use CDN for static content
5. Review and cleanup unused resources monthly

---

## Next Steps After Deployment

### Week 1
- [ ] Monitor error rates and fix issues
- [ ] Gather user feedback
- [ ] Optimize slow endpoints
- [ ] Set up analytics tracking

### Month 1
- [ ] Achieve 70% test coverage
- [ ] Implement caching layer
- [ ] Add business metrics dashboard
- [ ] Conduct security audit

### Quarter 1
- [ ] Implement auto-scaling
- [ ] Add load balancing
- [ ] Optimize database performance
- [ ] Plan feature roadmap

---

## Quick Reference Commands

```bash
# Build and test
npm run build
npm run test
npm run test:e2e

# Start production server
npm start

# Deploy Firebase config
firebase deploy --only firestore:rules,firestore:indexes

# Backup database
./scripts/backup-firestore.sh

# Check logs (PM2)
pm2 logs coinbox-ai

# Restart server (PM2)
pm2 restart coinbox-ai

# View production logs (Vercel)
vercel logs <deployment-url>
```

---

## Documentation Links

- [Production Readiness Report](./PRODUCTION_READINESS_REPORT.md)
- [Security Implementation](./docs/security-implementation-guide.md)
- [API Documentation](./docs/api-documentation.md)
- [Database Schema](./docs/database-schema.md)

---

**Last Updated:** November 27, 2024  
**Version:** 1.0  
**Maintainer:** DevOps Team

For questions or issues, refer to the [Production Readiness Report](./PRODUCTION_READINESS_REPORT.md) or contact the development team.
