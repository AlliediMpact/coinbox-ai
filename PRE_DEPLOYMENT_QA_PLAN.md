# Pre-Deployment Quality Assurance Plan

**Date:** December 2, 2025  
**Current Coverage:** 72.12%  
**Target Coverage:** 95%+  
**Status:** 🟡 In Progress

---

## 🎯 Quality Gates (Must Pass Before Deployment)

### 1. Test Coverage ✅ / ⏳
- [ ] Overall coverage: **95%+** (Currently: 72.12%)
- [ ] Branch coverage: **90%+** (Currently: 58.24%)
- [ ] Function coverage: **90%+** (Currently: 76.13%)
- [ ] Line coverage: **95%+** (Currently: 72.62%)

### 2. UI/UX Testing ⏳
- [ ] **Bank Account Verification Component** tested manually
- [ ] **Admin Support Tickets Dashboard** tested manually
- [ ] **Loan Repayment Notifications** verified
- [ ] All new UI components responsive on mobile/tablet/desktop
- [ ] Accessibility (WCAG 2.1 AA) compliance checked
- [ ] User flows documented and tested

### 3. Integration Testing ⏳
- [ ] Bank verification API integration tested
- [ ] Paystack Resolve Account API working
- [ ] Firestore database operations verified
- [ ] Email service integration tested
- [ ] Cron job execution verified

### 4. Security Testing ⏳
- [ ] Authentication checks on new routes
- [ ] Authorization verified (admin-only routes)
- [ ] Input validation on all forms
- [ ] API rate limiting tested
- [ ] SQL injection prevention (N/A - NoSQL)
- [ ] XSS prevention verified

### 5. Performance Testing ⏳
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] Database query optimization
- [ ] Lighthouse score > 90

---

## 📋 Sprint 1 Features Testing Checklist

### Feature 1: Bank Account Verification

**Unit Tests:**
- [x] `validateAccountNumber()` - 9-11 digits validation
- [x] `SOUTH_AFRICAN_BANKS` - 10 banks with correct codes
- [x] `verifyBankAccount()` - Paystack API integration
- [x] `storeBankAccount()` - Firestore storage
- [x] `getBankAccount()` - Retrieval logic
- [x] Error handling and edge cases

**Integration Tests:**
- [ ] API route `/api/bank/verify` POST endpoint
- [ ] API route `/api/bank/verify` GET endpoint
- [ ] Paystack API connectivity
- [ ] Firestore `bank_accounts` collection CRUD

**UI/UX Tests:**
- [ ] Bank selector dropdown displays 10 banks
- [ ] Account number input validation (9-11 digits)
- [ ] "Verify Account" button triggers API call
- [ ] Loading state displays during verification
- [ ] Success: Account name displays + green badge
- [ ] Error: Error message displays clearly
- [ ] Mobile responsiveness
- [ ] Keyboard navigation works
- [ ] Screen reader accessibility

**Manual Test Scenarios:**
```
1. Valid Account Test:
   - Select "Standard Bank"
   - Enter: 1234567890
   - Click "Verify"
   - Expected: Account name appears or "Could not verify" message

2. Invalid Account Test:
   - Select "ABSA Bank"
   - Enter: 999999999
   - Click "Verify"
   - Expected: "Invalid account" error message

3. Invalid Format Test:
   - Enter: 12345 (< 9 digits)
   - Expected: Validation error before API call

4. Network Error Test:
   - Disconnect internet
   - Click "Verify"
   - Expected: "Network error" message
```

---

### Feature 2: Loan Repayment Automation

**Unit Tests:**
- [x] `checkUpcomingRepayments()` - Daily cron logic
- [x] `sendRepaymentReminder()` - 7/3/1 day reminders
- [x] `markAsOverdue()` - Overdue handling
- [x] `processRepayment()` - Payment distribution (5%/15%/25%/55%)
- [x] `getUserLoans()` - Loan retrieval
- [x] `getOverdueLoans()` - Overdue list

**Integration Tests:**
- [ ] API route `/api/cron/check-loan-repayments` GET
- [ ] API route `/api/loans/repay` POST
- [ ] API route `/api/loans/repay` GET
- [ ] Email template rendering
- [ ] In-app notification creation
- [ ] Firestore `escrow` collection updates

**Cron Job Tests:**
- [ ] Vercel cron configuration in `vercel.json`
- [ ] CRON_SECRET authorization
- [ ] Manual trigger test
- [ ] Daily execution at 9 AM SAST

**Email Template Tests:**
- [ ] `loan_reminder.html` renders correctly
- [ ] `loan_overdue.html` renders correctly
- [ ] Variables replaced ({{borrowerName}}, {{loanAmount}}, etc.)
- [ ] "Repay Now" button links to dashboard
- [ ] Mobile email client compatibility

**Manual Test Scenarios:**
```
1. 7-Day Reminder Test:
   - Create loan with due date = today + 7 days
   - Trigger cron manually: curl /api/cron/check-loan-repayments
   - Expected: Email sent to borrower with "7 days" message

2. 3-Day Reminder Test:
   - Create loan with due date = today + 3 days
   - Trigger cron
   - Expected: More urgent email sent

3. 1-Day Final Reminder Test:
   - Create loan with due date = tomorrow
   - Trigger cron
   - Expected: "URGENT: Due tomorrow" email

4. Overdue Test:
   - Create loan with due date = yesterday
   - Trigger cron
   - Expected: "OVERDUE" email + loan status = "overdue"

5. Repayment Test:
   - POST /api/loans/repay with loanId
   - Expected: 
     - Loan status = "repaid"
     - Lender receives 5% to wallet + 15% to bank
     - Platform gets 25% fee
     - Interest distributed 55% to lender
```

---

### Feature 3: Admin Support Ticket Management

**Unit Tests:**
- [x] `getAllTickets()` - Retrieve all tickets
- [x] `getTicketsByStatus()` - Filter by status
- [x] `getAssignedTickets()` - Filter by admin
- [x] `getTicketById()` - Single ticket retrieval
- [x] `assignTicket()` - Assign to admin
- [x] `updateTicketStatus()` - Change status
- [x] `updateTicketPriority()` - Change priority
- [x] `addReply()` - Add reply
- [x] `resolveTicket()` - Mark as resolved
- [x] `getTicketStats()` - Calculate statistics

**Integration Tests:**
- [ ] Page route `/dashboard/admin/support-tickets`
- [ ] Authentication check (admin only)
- [ ] Firestore `support_tickets` collection CRUD
- [ ] Real-time updates

**UI/UX Tests:**
- [ ] Dashboard stats cards display correctly
- [ ] Filter buttons work (All, Open, In Progress, Resolved, Closed)
- [ ] Ticket list displays with correct badges
- [ ] Click ticket → details panel opens
- [ ] "Assign to Me" button works
- [ ] Status dropdown updates ticket
- [ ] Priority dropdown updates ticket
- [ ] Reply form submits successfully
- [ ] "Mark as Resolved" prompts for note
- [ ] Mobile responsiveness
- [ ] Loading states display
- [ ] Error messages display

**Manual Test Scenarios:**
```
1. Create Ticket Flow:
   - As user: Go to /dashboard/support
   - Create ticket: Subject="Test", Description="Testing"
   - Expected: Ticket created successfully

2. Admin View Flow:
   - As admin: Go to /dashboard/admin/support-tickets
   - Expected: Dashboard shows stats + ticket list

3. Assign Ticket Flow:
   - Click test ticket
   - Click "Assign to Me"
   - Expected: Status changes to "In Progress", your name shows

4. Add Reply Flow:
   - Type reply: "Working on this issue"
   - Click "Send Reply"
   - Expected: Reply appears in thread with admin badge

5. Change Priority Flow:
   - Select "High" from priority dropdown
   - Expected: Badge changes to orange "High"

6. Resolve Ticket Flow:
   - Click "Mark as Resolved"
   - Enter note: "Issue fixed"
   - Expected: Status = "Resolved", green badge, note saved

7. Filter Flow:
   - Click "Resolved" filter button
   - Expected: Only resolved tickets show
```

---

## 🔧 Test Coverage Improvement Plan

### Missing Tests to Reach 95%:

#### 1. New Sprint 1 Services (0% → 95%)
- [x] `bank-verification-service.ts` tests created
- [x] `loan-repayment-service.ts` tests created
- [x] `support-ticket-service.ts` tests created
- [ ] Fix test failures (import issues)

#### 2. New API Routes (0% → 90%)
- [ ] `/api/bank/verify/route.ts` tests
- [ ] `/api/cron/check-loan-repayments/route.ts` tests
- [ ] `/api/loans/repay/route.ts` tests

#### 3. New Components (0% → 90%)
- [ ] `BankAccountVerification.tsx` tests
- [ ] `admin/support-tickets/page.tsx` tests

#### 4. Existing Services (72% → 95%)
- [ ] `transaction-monitoring-service.ts` - Add missing branches
- [ ] `trading-rate-limit.ts` - Cover Firestore fallback path
- [ ] `firebase-admin.ts` - Basic initialization tests

#### 5. Email Templates (0% → 80%)
- [ ] `loan_reminder.html` rendering tests
- [ ] `loan_overdue.html` rendering tests
- [ ] Variable substitution tests

---

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest run src/lib/__tests__/bank-verification-service.test.ts

# Run tests in watch mode
npx vitest watch

# Run integration tests only
npx vitest run src/tests/integration/

# Generate coverage report
npm run test:coverage -- --reporter=html
```

---

## 📊 Current Status

**Test Results:**
- ✅ **220 tests passing**
- ❌ **3 test suites failing** (new Sprint 1 tests - import issues)
- ⏭️ **6 tests skipped**

**Coverage Breakdown:**
- **Overall:** 72.12% → Target: 95%
- **components/:** 86.04% → Target: 95%
- **components/admin/:** 70.68% → Target: 95%
- **lib/:** 67.18% → Target: 95%
- **middleware/:** 78.26% → Target: 90%

**Issues to Fix:**
1. ❌ `bank-verification-service.test.ts` - Missing Firebase mock
2. ❌ `loan-repayment-service.test.ts` - Missing notificationService
3. ❌ `support-ticket-service.test.ts` - Missing firebase config

---

## 🚀 Next Steps

### Immediate (Today):
1. ✅ Create test files for Sprint 1 features
2. ⏳ Fix import/mock issues in new tests
3. ⏳ Run tests and verify 220+ passing
4. ⏳ Start dev server for manual UI testing

### Short-term (This Week):
1. [ ] Create API route integration tests
2. [ ] Create component integration tests
3. [ ] Achieve 95%+ coverage
4. [ ] Manual UI/UX testing of all 3 features
5. [ ] Document any bugs found
6. [ ] Fix bugs
7. [ ] Final test run

### Before Deployment:
1. [ ] All tests passing (0 failures)
2. [ ] Coverage ≥ 95%
3. [ ] Manual testing complete
4. [ ] UI/UX approved
5. [ ] Performance benchmarks met
6. [ ] Security checklist complete
7. [ ] Deployment checklist ready

---

## ✅ Definition of Done

Sprint 1 is **NOT ready for deployment** until:

- [ ] **All automated tests pass** (0 failures)
- [ ] **Test coverage ≥ 95%**
- [ ] **All 3 new features manually tested and approved**
- [ ] **No critical bugs found**
- [ ] **Performance metrics meet targets**
- [ ] **Security audit passed**
- [ ] **Documentation updated**
- [ ] **Stakeholder approval received**

---

**Last Updated:** December 2, 2025  
**Status:** 🟡 Testing in Progress  
**Est. Completion:** TBD (Quality over speed)
