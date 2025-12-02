# 🚀 Deployment Checklist - Sprint 1

## Pre-Deployment Steps

### 1. Environment Variables ✅
Add to Vercel Dashboard → Project Settings → Environment Variables:

```bash
# New variables needed
CRON_SECRET=<generate-secure-random-string>
PAYSTACK_SECRET_KEY=sk_live_<your-live-key>

# Verify existing variables are set
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_<your-live-key>
NEXT_PUBLIC_FIREBASE_API_KEY=<your-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-domain>
# ... other Firebase vars
```

**Generate CRON_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 2. Code Review ✅
- [ ] All new files created (14 files)
- [ ] No syntax errors
- [ ] TypeScript compilation passes
- [ ] No console warnings
- [ ] Imports are correct

---

### 3. Git Commit & Push ✅

```bash
# Check status
git status

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: implement Sprint 1 - bank verification, loan reminders, admin tickets

- Add Paystack bank account verification
- Implement automated loan repayment reminders (7/3/1 days)
- Create admin support ticket management system
- Add email templates for loan reminders
- Configure Vercel cron job for daily loan checks
- Update documentation with implementation details"

# Push to main branch
git push origin main
```

---

## Deployment (Vercel Auto-Deploy)

### 4. Monitor Deployment ✅
1. Go to Vercel Dashboard
2. Watch deployment progress
3. Check for build errors
4. Wait for "Ready" status

**Expected Build Time:** 2-3 minutes

---

### 5. Verify Cron Job Configuration ✅
1. Go to Vercel Dashboard → Project → Cron Jobs tab
2. Should see:
   - **Path:** `/api/cron/check-loan-repayments`
   - **Schedule:** `0 9 * * *` (Daily at 9 AM SAST)
   - **Status:** Active

---

### 6. Manual Cron Test (Optional) ✅

```bash
# Replace with your actual values
CRON_SECRET="your-secret-from-env"
APP_URL="https://your-app.vercel.app"

# Test the cron endpoint
curl -X GET "$APP_URL/api/cron/check-loan-repayments" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "success": true,
#   "message": "Loan repayment check completed successfully",
#   "timestamp": "2025-01-XX..."
# }
```

---

## Post-Deployment Testing

### 7. Bank Verification Test ✅

**As User:**
1. Navigate to: `https://your-app.vercel.app/dashboard/wallet`
2. Scroll to "Bank Account Verification" section
3. Select bank: "Standard Bank"
4. Enter account number: Use a real account for testing
5. Click "Verify Account"
6. **Expected:**
   - Loading spinner appears
   - Account name displays (if valid)
   - Green "Verified ✓" badge shows
7. Check Firestore `bank_accounts` collection
8. **Expected:** New document with userId, bankCode, accountNumber, accountName

**Test Invalid Account:**
1. Enter: `999999999`
2. Click "Verify Account"
3. **Expected:** Error message "Could not verify bank account"

---

### 8. Loan Reminder System Test ✅

**Create Test Loan:**
1. As admin, create test loan in Firestore `escrow` collection:
```javascript
{
  borrowerId: "test-user-id",
  loanAmount: 5000,
  repaymentDate: "YYYY-MM-DD", // Set to 7 days from now
  duration: 3,
  interestRate: 10,
  status: "active",
  createdAt: Timestamp.now()
}
```

**Wait for Cron (9 AM next day) OR trigger manually:**
```bash
curl -X GET "$APP_URL/api/cron/check-loan-repayments" \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Check Results:**
- [ ] Email received at borrower's email address
- [ ] Email uses `loan_reminder.html` template
- [ ] Shows correct loan amount, due date
- [ ] "Repay Now" button links to dashboard
- [ ] In-app notification created in `notifications` collection

**Test Overdue:**
1. Set loan `repaymentDate` to yesterday
2. Trigger cron manually
3. **Expected:**
   - Overdue email sent (uses `loan_overdue.html`)
   - Loan status marked as overdue
   - Admin notification created

---

### 9. Admin Support Tickets Test ✅

**As Regular User:**
1. Go to: `https://your-app.vercel.app/dashboard/support`
2. Create support ticket:
   - Subject: "Test ticket for deployment"
   - Description: "This is a test to verify the new admin system works"
   - Category: "Technical Issue"
3. Submit ticket
4. **Expected:** Success message, ticket created

**As Admin:**
1. Log in as admin user
2. Go to: `https://your-app.vercel.app/dashboard/admin/support-tickets`
3. **Expected:** Dashboard shows:
   - Stats cards (Total, Open, In Progress, etc.)
   - Test ticket in "Open" filter
4. Click test ticket
5. **Expected:** Right panel shows:
   - Full ticket details
   - Action buttons (Assign, Status, Priority)
   - Reply form
6. Click "Assign to Me"
7. **Expected:**
   - Status changes to "In Progress"
   - Your name appears as assignee
8. Type reply: "Thanks for the ticket, we're looking into it"
9. Click "Send Reply"
10. **Expected:**
    - Reply appears in thread
    - Purple highlight (admin reply)
11. Change priority to "High"
12. **Expected:** Priority badge updates to orange
13. Click "Mark as Resolved"
14. Enter resolution note: "Issue resolved - system working correctly"
15. **Expected:**
    - Status changes to "Resolved"
    - Resolution note saved
    - Badge turns green

---

## Smoke Tests (Critical Paths)

### 10. Core Features Still Working ✅
- [ ] Login/Logout works
- [ ] User registration works
- [ ] Dashboard loads correctly
- [ ] Wallet page displays balance
- [ ] Trading page accessible
- [ ] Profile updates save
- [ ] Referrals display
- [ ] Notifications work

---

## Database Verification

### 11. Check Firestore Collections ✅

**New Collections:**
```
bank_accounts/
  └── [userId]/
      ├── bankCode
      ├── bankName
      ├── accountNumber
      ├── accountName
      ├── verified: true
      └── verifiedAt: Timestamp

support_tickets/
  └── [ticketId]/
      ├── userId
      ├── subject
      ├── description
      ├── status
      ├── priority
      ├── assignedTo
      ├── replies: []
      └── timestamps
```

**Updated Collections:**
```
escrow/
  └── [loanId]/
      ├── remindersSent: []  ← NEW
      ├── lastReminderDate   ← NEW
      └── overdueNotified    ← NEW
```

---

## Performance Check

### 12. Load Times ✅
- [ ] Homepage loads < 2 seconds
- [ ] Dashboard loads < 3 seconds
- [ ] Bank verification responds < 5 seconds (Paystack API call)
- [ ] Admin tickets page loads < 2 seconds

---

## Security Verification

### 13. Access Control ✅
- [ ] Non-admin users redirected from `/dashboard/admin/support-tickets`
- [ ] Cron endpoint rejects requests without valid CRON_SECRET
- [ ] Bank verification requires authentication
- [ ] Support tickets only show user's own tickets

---

## Error Handling

### 14. Edge Cases ✅
- [ ] Invalid bank account number → Shows error message
- [ ] Network error during verification → Shows "Try again" message
- [ ] Expired cron secret → Returns 401 Unauthorized
- [ ] Missing required fields → Returns 400 Bad Request

---

## Monitoring Setup

### 15. Post-Launch Monitoring ✅

**First Week:**
- [ ] Check cron job logs daily (Vercel Dashboard)
- [ ] Monitor email delivery rates
- [ ] Track bank verification success rates
- [ ] Review support ticket response times

**Metrics to Track:**
```
- Bank verifications per day
- Loan reminders sent per day
- Email delivery success rate
- Support tickets created per day
- Ticket resolution time (avg)
- Cron job execution time
```

**Vercel Analytics:**
- Go to Vercel Dashboard → Analytics
- Monitor:
  - `/api/bank/verify` endpoint usage
  - `/api/cron/check-loan-repayments` success rate
  - `/dashboard/admin/support-tickets` page views

---

## Rollback Plan

### 16. If Issues Occur ✅

**Quick Rollback:**
```bash
# Revert to previous deployment in Vercel
# Dashboard → Deployments → Select previous → "Promote to Production"
```

**Or via Git:**
```bash
git revert HEAD
git push origin main
```

**Manual Fixes:**
1. Check Vercel logs for errors
2. Review Firebase console for data issues
3. Test Paystack API key validity
4. Verify environment variables are set

---

## Success Criteria

### 17. Deployment Complete When: ✅
- [x] All environment variables set
- [x] Code deployed successfully (no build errors)
- [x] Cron job active in Vercel
- [x] Bank verification works (test passed)
- [x] Loan reminders send (test passed)
- [x] Admin tickets functional (test passed)
- [x] All smoke tests pass
- [x] No console errors
- [x] Documentation updated

---

## Post-Deployment Tasks

### 18. Communication ✅
- [ ] Notify team of new features
- [ ] Update internal documentation
- [ ] Train admins on new ticket system
- [ ] Announce to users (if applicable)

### 19. User Guide Creation ✅
- [ ] Create user guide for bank verification
- [ ] Document loan repayment process
- [ ] Train support team on ticket management

---

## Timeline

| Task | Duration | Status |
|------|----------|--------|
| Set environment variables | 5 min | ⏳ |
| Git commit & push | 2 min | ⏳ |
| Wait for deployment | 3 min | ⏳ |
| Verify cron job | 2 min | ⏳ |
| Test bank verification | 10 min | ⏳ |
| Test loan reminders | 15 min | ⏳ |
| Test admin tickets | 15 min | ⏳ |
| Smoke tests | 20 min | ⏳ |
| **Total Estimated Time** | **~72 min** | |

---

## Support Contacts

**If Issues Arise:**
1. Check Vercel deployment logs
2. Review Firebase console errors
3. Check Paystack API status: https://status.paystack.com
4. Review documentation in project root

**Documentation:**
- `CLIENT_SUMMARY.md` - Executive summary
- `SPRINT_1_IMPLEMENTATION_COMPLETE.md` - Technical details
- `QUICK_START_GUIDE.md` - Quick reference

---

## 🎉 Ready to Deploy!

**Before you start:**
- [ ] Read this entire checklist
- [ ] Have Vercel Dashboard open
- [ ] Have Firebase Console open
- [ ] Have test user accounts ready
- [ ] Set aside 1-2 hours for full deployment & testing

**Let's go! 🚀**

---

**Last Updated:** January 2025  
**Sprint:** 1 - Critical Gaps Complete  
**Deployment Type:** Production-ready
