# CoinBox AI - Comprehensive System Workflow Documentation

**Version:** 2.0.0  
**Date:** 2024  
**Status:** Production-Ready Platform

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Complete User Journey Map](#complete-user-journey-map)
4. [Authentication & Onboarding Flow](#authentication--onboarding-flow)
5. [Role-Based Access Control](#role-based-access-control)
6. [Dashboard Navigation Map](#dashboard-navigation-map)
7. [Financial Workflows](#financial-workflows)
8. [Trading & P2P Workflows](#trading--p2p-workflows)
9. [Admin & Support Workflows](#admin--support-workflows)
10. [Feature Integration Map](#feature-integration-map)
11. [Gap Analysis & Missing Components](#gap-analysis--missing-components)
12. [Recommendations](#recommendations)

---

## 1. System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 14 App Router (React 18.2.0 + TypeScript)             │
│  • Server Components (RSC)                                       │
│  • Client Components ('use client')                              │
│  • Middleware (auth protection)                                  │
│  • API Routes (/api/*)                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    CONTEXT PROVIDERS                             │
├─────────────────────────────────────────────────────────────────┤
│  ErrorBoundary                                                   │
│    └── AuthProvider (Firebase Auth, user state)                 │
│         └── OnboardingProvider (signup flow tracking)           │
│              └── SidebarProvider (UI state)                     │
│                   └── HeaderSidebarLayout                       │
│                        └── PageTransition                       │
│                             └── {children}                      │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER (70+ services)                  │
├─────────────────────────────────────────────────────────────────┤
│  Authentication      │  Financial          │  Communication      │
│  • auth-service      │  • wallet-service   │  • messaging-svc    │
│  • auth-utils        │  • trading-service  │  • notification-svc │
│  • auth-helpers      │  • paystack-service │  • email-service    │
│                      │  • transaction-svc  │                     │
│  ─────────────────────────────────────────────────────────────  │
│  Risk & Compliance   │  Advanced Features  │  Analytics          │
│  • risk-assessment   │  • crypto-wallet    │  • user-analytics   │
│  • dispute-resolution│  • id-verification  │  • analytics-export │
│  • kyc-service       │  • ml-fraud-detect  │  • ai-summarization │
│  • audit-log         │  • multi-currency   │                     │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Firebase Services             │  External APIs                  │
│  • Firebase Auth               │  • Paystack (payments)          │
│  • Firestore (NoSQL database)  │  • Smile Identity (KYC)        │
│  • Firebase Storage            │  • Cryptocurrency APIs          │
│  • Firebase Admin SDK          │  • Exchange Rate APIs           │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

**Frontend:**
- **52 Pages** across authentication, dashboard, admin, and marketing sections
- **40+ Reusable Components** (UI components, feature components)
- **TailwindCSS + Radix UI** for styling and accessible components
- **Framer Motion** for animations and transitions

**Backend:**
- **Next.js API Routes** (SSR-safe endpoints)
- **Firebase Admin SDK** (server-side operations)
- **Real-time Firestore listeners** (live updates)

**State Management:**
- **React Context API** (AuthProvider, OnboardingProvider, SidebarProvider)
- **Local state** with React hooks
- **Real-time subscriptions** via Firestore onSnapshot

---

## 2. Technology Stack

### Core Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 14.x | App Router, SSR, API Routes |
| **UI Library** | React | 18.2.0 | Component-based UI |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | TailwindCSS | 3.4.4 | Utility-first CSS |
| **Component Library** | Radix UI | Latest | Accessible UI primitives |
| **Animation** | Framer Motion | Latest | Smooth transitions |
| **Backend** | Firebase | 9.x | Auth, Firestore, Storage |
| **Payments** | Paystack | Latest | South African payments |
| **Testing** | Vitest + Playwright | Latest | Unit & E2E tests |
| **Validation** | Zod | Latest | Schema validation |

### Service Integrations

1. **Paystack** - Payment processing for ZAR (South African Rand)
2. **Smile Identity** - KYC/ID verification (Phase 4)
3. **Cryptocurrency APIs** - Multi-coin wallet support (Phase 4)
4. **Firebase Emulators** - Local development environment

---

## 3. Complete User Journey Map

### Anonymous User Journey

```
┌──────────────────┐
│  Landing Page    │  →  User sees hero section, features, live transactions
│  (/)             │      CTA buttons: "Get Started" / "Sign In"
└────────┬─────────┘
         │
         ├─────────────────────────────────────────────┐
         │                                             │
         ▼                                             ▼
┌──────────────────┐                         ┌──────────────────┐
│  Login Modal     │                         │  Signup Flow     │
│  (/auth)         │                         │  (/auth/signup)  │
└────────┬─────────┘                         └────────┬─────────┘
         │                                             │
         │                                             │
         │ Enter credentials                           │ 4-Step Wizard:
         │ (email + password)                          │ 1. Account details
         │                                             │    (name, email, phone, referral)
         │                                             │ 2. Password setup
         │                                             │    (meet 5 requirements)
         │                                             │ 3. Membership tier selection
         │                                             │    (Basic/Ambassador/VIP/Business)
         │                                             │ 4. Review & Payment
         │                                             │    
         │                                             ▼
         │                                    ┌──────────────────┐
         │                                    │ Paystack Payment │
         │                                    │ (Security Deposit)│
         │                                    └────────┬─────────┘
         │                                             │
         │                                             ▼
         │                                    ┌──────────────────┐
         │                                    │ Complete Signup  │
         │                                    │ Set Password     │
         │                                    │ (/auth/complete) │
         │                                    └────────┬─────────┘
         │                                             │
         └─────────────────┬───────────────────────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Email Verification│
                  │ (/auth/verify)   │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │   Dashboard      │
                  │  (/dashboard)    │
                  └──────────────────┘
```

### Authenticated User Journey

```
┌──────────────────┐
│   Dashboard      │  →  Overview of account, wallet balance, quick actions
│  (/dashboard)    │      Recent transactions, risk assessment, AI features
└────────┬─────────┘
         │
         ├───────────────┬───────────────┬───────────────┬───────────────┐
         │               │               │               │               │
         ▼               ▼               ▼               ▼               ▼
    ┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
    │Trading │     │ Wallet │     │  P2P   │     │Security│     │ More   │
    └────┬───┘     └────┬───┘     └────┬───┘     └────┬───┘     └────┬───┘
         │              │              │              │              │
         │              │              │              │              │
    Buy/Sell      Deposits        Transfer       MFA Setup      Referrals
    Invest/       Withdrawals     Peer-to-Peer   Risk Monitor   Support
    Borrow        Swap Crypto     Loans          Security Log   Analytics
    Escrow        Transactions                   KYC Verify     Disputes
```

---

## 4. Authentication & Onboarding Flow

### Signup Process (4-Step Wizard)

#### Step 1: Account Details
**Page:** `/auth/signup`  
**Fields:**
- Full Name (required)
- Email (required, validated)
- Phone (required, format validated)
- Referral Code (optional)

**Validation:**
- Email format check
- Phone number format (South African +27)
- Duplicate email check (server-side)

#### Step 2: Password Setup
**Requirements (all must be met):**
1. ✓ At least 8 characters long
2. ✓ Contains uppercase letter
3. ✓ Contains lowercase letter
4. ✓ Contains number
5. ✓ Contains special character

**UI Features:**
- Real-time validation feedback
- Show/hide password toggle
- Visual requirement checklist

#### Step 3: Membership Tier Selection

**Available Tiers:**

| Tier | Security Fee | Refundable | Loan Limit | Investment Limit | Commission | Admin Fee |
|------|--------------|------------|------------|------------------|------------|-----------|
| **Basic** | R550 | R500 | R500 | R5,000 | 1% | R50 |
| **Ambassador** | R1,100 | R1,000 | R1,000 | R10,000 | 2% | R100 |
| **VIP** | R5,500 | R5,000 | R5,000 | R50,000 | 3% | R500 |
| **Business** | R11,000 | R10,000 | R10,000 | R100,000 | 5% | R1,000 |

**Selection Factors:**
- Trading volume expectations
- Borrowing needs
- Investment capacity
- Referral activity plans

#### Step 4: Review & Payment

**Process:**
1. Display summary of entered information
2. Show selected tier details
3. Confirm security deposit amount
4. **Create Pending User** (API: `/api/auth/create-pending-user`)
   - Server validates all inputs
   - Creates temporary record in Firestore
   - Returns `temporaryId` and `expectedAmountKobo`
5. **Initialize Paystack Payment**
   - Popup Paystack inline payment modal
   - User completes payment via Paystack
   - On success: redirect to `/auth/complete-signup?reference={ref}&temporaryId={id}`
   - On cancel: stay on signup page with notification

#### Step 5: Complete Signup

**Page:** `/auth/complete-signup`  
**Query Params:**
- `reference` - Paystack payment reference
- `temporaryId` - Temporary user ID from pending record

**Process:**
1. Verify payment reference with Paystack
2. Retrieve pending user data using temporaryId
3. User sets final password (re-validated)
4. **Create Firebase Auth User** (API: `/api/auth/signup`)
   - Creates user in Firebase Auth
   - Creates user document in Firestore `users` collection
   - Creates wallet document in `wallets` collection
   - Assigns membership tier
   - Records security deposit
   - Processes referral if code provided
5. Send verification email
6. Redirect to `/dashboard/profile`

### Login Process

**Page:** `/auth` (Login Modal)  
**Fields:**
- Email
- Password

**Features:**
- Remember me checkbox
- Forgot password link → `/auth/reset-password`
- Sign up link → `/auth/signup`
- MFA support (if enabled by user)

**Process:**
1. Submit credentials to Firebase Auth
2. Check email verification status
3. Retrieve user custom claims (role: admin, support, user)
4. Redirect to dashboard or admin panel

### Password Reset Flow

**Pages:**
1. `/auth/reset-password` - Enter email
2. Email sent with reset link
3. Firebase handles password reset
4. User sets new password
5. Redirect to login

### Email Verification

**Page:** `/auth/verify-email`  
**Process:**
1. User clicks verification link from email
2. Firebase verifies email token
3. Updates user `emailVerified` status
4. Redirect to dashboard

---

## 5. Role-Based Access Control (RBAC)

### User Roles

#### 1. **User** (Default Role)
**Access:**
- Own dashboard and profile
- Trading features (invest/borrow)
- Wallet management (deposit/withdraw)
- P2P transfers
- Referral system
- Support tickets
- Transactions history
- Security settings

**Restrictions:**
- Cannot access admin routes
- Cannot view other users' data
- Cannot modify system settings
- Transaction limits based on membership tier

#### 2. **Support** (Customer Service)
**Access:**
- Support dashboard (`/dashboard/admin/support` or similar)
- View user profiles (read-only)
- Manage support tickets
- View dispute details
- Send notifications to users
- Access transaction logs

**Restrictions:**
- Cannot modify user balances directly
- Cannot access full admin panel
- Cannot delete users
- Cannot modify system configurations

#### 3. **Admin** (Full Access)
**Access:**
- Admin Dashboard (`/dashboard/admin`)
- User Management (`/dashboard/admin/users`)
  - View all users
  - Edit user details
  - Change membership tiers
  - Suspend/activate accounts
  - View complete transaction history
- Transaction Monitoring (`/dashboard/admin/transaction-monitoring`)
  - Real-time transaction feed
  - Flagged transactions
  - Risk assessment reports
  - Manual review queue
- Dispute Resolution (`/dashboard/admin/disputes`)
  - View all disputes
  - Assign arbitrators
  - Resolve disputes
  - Issue refunds
- System Monitoring (`/dashboard/admin/monitoring`)
  - Platform analytics
  - User growth metrics
  - Revenue reports
  - System health status

**Implementation:**

```typescript
// src/lib/auth-utils.ts
export async function hasAdminAccess(
  userId: string, 
  requireFullAccess: boolean = false
): Promise<boolean> {
  // Check Firebase custom claims
  const user = await adminAuth.getUser(userId);
  if (user.customClaims?.role === 'admin') return true;
  
  // Support role grants access if not requiring full admin
  if (!requireFullAccess && user.customClaims?.role === 'support') {
    return true;
  }
  
  // Fallback to Firestore role field
  const userDoc = await adminDb.collection('users').doc(userId).get();
  const userData = userDoc.data();
  if (userData?.role === 'admin') return true;
  if (!requireFullAccess && userData?.role === 'support') return true;
  
  return false;
}
```

### Protected Routes

**Middleware:** `src/middleware.ts`

```typescript
// Protects routes based on authentication and role
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public routes
  if (PUBLIC_ROUTES.includes(path)) return NextResponse.next();
  
  // Check authentication
  const token = request.cookies.get('auth-token');
  if (!token) return NextResponse.redirect('/auth');
  
  // Check admin routes
  if (path.startsWith('/dashboard/admin')) {
    const hasAccess = await verifyAdminToken(token);
    if (!hasAccess) return NextResponse.redirect('/dashboard');
  }
  
  return NextResponse.next();
}
```

**Component-Level Protection:**

```tsx
// src/components/RoleProtectedRoute.tsx
export function RoleProtectedRoute({ 
  children, 
  allowedRoles = ['admin', 'support'] 
}) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  
  useEffect(() => {
    const checkAccess = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userRole = userDoc.data()?.role;
      setHasAccess(allowedRoles.includes(userRole));
    };
    checkAccess();
  }, [user]);
  
  if (!hasAccess) return <Navigate to="/dashboard" />;
  return children;
}
```

---

## 6. Dashboard Navigation Map

### User Dashboard Structure

```
/dashboard
├── /                          # Dashboard Home
├── /wallet                    # Wallet Management
├── /trading                   # Coin Trading (Buy/Sell/Invest/Borrow)
├── /p2p                       # P2P Trading
├── /swap                      # Cryptocurrency Swap
├── /transactions              # Transaction History
├── /receipts                  # Payment Receipts
├── /disputes                  # Trade Disputes
├── /security                  # Security Settings & 2FA
├── /risk                      # Risk Assessment
├── /referral                  # Referral Program
├── /commissions               # Referral Commissions Earned
├── /analytics                 # Personal Analytics Dashboard
├── /support                   # Support Tickets
├── /notifications             # Notification Center
├── /payments                  # Payment Management
├── /profile                   # User Profile
├── /settings                  # Account Settings
├── /kyc                       # KYC Verification
├── /membership                # Membership Management
├── /messages                  # In-App Messaging (Phase 4)
└── /auth-management           # Auth Testing (Dev Only)
```

### Admin Dashboard Structure

```
/dashboard/admin
├── /                          # Admin Dashboard Home
├── /users                     # User Management
├── /transaction-monitoring    # Transaction Monitoring
├── /disputes                  # Dispute Resolution
└── /monitoring                # System Monitoring
```

### Navigation Component

**File:** `src/components/HeaderSidebar.tsx`

**Regular User Navigation Items:**

| Icon | Label | Route | Description |
|------|-------|-------|-------------|
| 🏠 | Dashboard | `/dashboard` | Overview of account |
| 🪙 | Coin Trading | `/dashboard/trading` | Buy and sell coins |
| 📈 | Swap | `/dashboard/swap` | Swap cryptocurrencies |
| 👥 | P2P Trading | `/dashboard/p2p` | Peer-to-peer trading |
| 💰 | Wallet | `/dashboard/wallet` | Manage funds |
| 📄 | Transactions | `/dashboard/transactions` | Transaction history |
| 🧾 | Receipts | `/dashboard/receipts` | Payment receipts |
| ⚠️ | Disputes | `/dashboard/disputes` | Manage disputes |
| 🛡️ | Security | `/dashboard/security` | Account security |
| 📊 | Risk Assessment | `/dashboard/risk` | Risk status |
| 🤝 | Referrals | `/dashboard/referral` | Manage referrals |
| ❓ | Support | `/dashboard/support` | Customer support |
| 🔔 | Notifications | `/dashboard/notifications` | View notifications |

**Admin Navigation Items:**

| Icon | Label | Route | Description |
|------|-------|-------|-------------|
| 👨‍💼 | Admin Dashboard | `/dashboard/admin` | Admin overview |
| 👥 | User Management | `/dashboard/admin/users` | Manage users |
| 🔍 | Transaction Monitoring | `/dashboard/admin/transaction-monitoring` | Monitor transactions |
| ⚖️ | Dispute Resolution | `/dashboard/admin/disputes` | Resolve disputes |
| 📊 | System Monitoring | `/dashboard/admin/monitoring` | System health |

---

## 7. Financial Workflows

### Wallet System

**Database Collections:**
- `wallets` - User wallet documents
  ```
  wallets/{userId}
    - balance: number
    - lockedBalance: number
    - currency: string (default "ZAR")
    - lastUpdated: timestamp
    - transactions/ (subcollection)
  ```

#### Deposit Flow

```
User clicks "Deposit" → Enter amount & method
                              ↓
        API: /api/payments/initialize (POST)
        Body: { userId, email, amount, type: 'deposit' }
                              ↓
        Paystack Service: initializePayment()
        Creates payment transaction record
                              ↓
        Returns: { authorization_url, reference }
                              ↓
        Redirect user to Paystack payment page
                              ↓
        User completes payment on Paystack
                              ↓
        Paystack Webhook: /api/webhooks/paystack (POST)
        Verifies payment, updates wallet balance
                              ↓
        Create transaction record:
        - type: "Deposit"
        - amount: {amount}
        - status: "completed"
        - method: "Paystack"
        - reference: {paystack_ref}
                              ↓
        Send notification to user
        Update wallet balance (real-time via onSnapshot)
```

**Component:** `src/components/WalletManagement.tsx`

**Key Features:**
- Real-time balance updates via Firestore listeners
- Transaction history with pagination
- Multiple payment methods (Paystack, Bank Transfer)
- CSV export of transactions
- Locked balance display (funds in escrow)

#### Withdrawal Flow

```
User requests withdrawal → Enter amount & bank details
                              ↓
        Validate: balance >= amount
        Validate: amount <= daily limit (tier-based)
                              ↓
        API: /api/wallet/withdraw (POST)
        Body: { userId, amount, bankDetails }
                              ↓
        Create pending withdrawal transaction
        Lock funds: lockedBalance += amount
                              ↓
        Admin reviews withdrawal request
        (or auto-approve based on risk score)
                              ↓
        Process payout via Paystack Transfer API
                              ↓
        On success:
        - Update balance: balance -= amount
        - Unlock funds: lockedBalance -= amount
        - Mark transaction as "completed"
                              ↓
        Send notification to user
```

**Withdrawal Limits (Tier-Based):**

| Tier | Daily Withdrawal Limit |
|------|------------------------|
| Basic | R5,000 |
| Ambassador | R10,000 |
| VIP | R25,000 |
| Business | R50,000 |

### Membership & Security Deposits

**Database Collection:** `user_memberships`

**Structure:**
```
user_memberships/{userId}
  - userId: string
  - currentTier: 'Basic' | 'Ambassador' | 'VIP' | 'Business'
  - securityDeposit: number (refundable portion)
  - adminFee: number (non-refundable)
  - joinDate: timestamp
  - renewalDate: timestamp (monthly)
  - paymentStatus: 'active' | 'pending' | 'overdue'
  - metrics:
      - monthlyTradingVolume: number
      - totalReferrals: number
      - successfulReferrals: number
```

**Membership Service:** `src/lib/membership-service.ts`

**Key Functions:**
- `upgradeMembership(userId, newTierId)` - Upgrade to higher tier
- `checkAndUpdateTier(userId)` - Auto-upgrade based on metrics
- `getTierBenefits(tierId)` - Get tier-specific benefits
- `getReferralCommissionRate(referrerId)` - Get commission rate

**Tier Benefits:**

```typescript
const MEMBERSHIP_TIERS = {
  basic: {
    monthlyFee: 0, // No monthly fee, only security deposit
    benefits: {
      tradingFeeDiscount: 0,
      maxDailyWithdrawal: 5000,
      supportPriority: 'normal',
      referralCommission: 0.01, // 1%
    }
  },
  ambassador: {
    monthlyFee: 0, // Security deposit model
    benefits: {
      tradingFeeDiscount: 0.1, // 10% off trading fees
      maxDailyWithdrawal: 10000,
      supportPriority: 'high',
      referralCommission: 0.02, // 2%
    },
    requirements: {
      minReferrals: 5
    }
  },
  // ... VIP and Business tiers
};
```

---

## 8. Trading & P2P Workflows

### Coin Trading System

**Page:** `/dashboard/trading`  
**Service:** `src/lib/trading-service.ts`

#### Trade Types

1. **Invest** - Lend money to borrowers, earn interest
2. **Borrow** - Request loan, pay interest to investors

#### Trading Process (Ticket-Based)

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Create Trade Ticket                                 │
└─────────────────────────────────────────────────────────────┘
User selects type: Invest or Borrow
Enter amount (validated against tier limits)
Set interest rate (10-25%)
Set duration (1-12 months)
                    ↓
API: /api/trading/create (POST)
Creates ticket in Firestore: tickets/{ticketId}
{
  userId: string,
  type: 'Invest' | 'Borrow',
  amount: number,
  interest: number,
  duration: number,
  status: 'Open' | 'Matched' | 'Escrow' | 'Completed' | 'Cancelled',
  membershipTier: string,
  riskScore: number,
  createdAt: timestamp
}

┌─────────────────────────────────────────────────────────────┐
│  Step 2: Match Tickets                                       │
└─────────────────────────────────────────────────────────────┘
System runs matching algorithm:
- Find opposite type (Invest ↔ Borrow)
- Match amount (exact or close)
- Compare interest rates
- Check risk scores
- Validate tier limits
                    ↓
API: /api/trading/match (POST)
Returns matched ticket or null

┌─────────────────────────────────────────────────────────────┐
│  Step 3: Create Escrow                                       │
└─────────────────────────────────────────────────────────────┘
When match found:
- Lock funds from investor's wallet
- Create escrow transaction
- Calculate total repayment: amount + (amount × interest/100)
- Notify both parties
                    ↓
Firestore: escrow/{escrowId}
{
  ticketId: string,
  investorId: string,
  borrowerId: string,
  amount: number,
  interest: number,
  repaymentAmount: number,
  status: 'Pending' | 'Active' | 'Completed' | 'Disputed',
  dueDate: timestamp,
  createdAt: timestamp
}

┌─────────────────────────────────────────────────────────────┐
│  Step 4: Confirm Trade                                       │
└─────────────────────────────────────────────────────────────┘
Both parties confirm the trade
                    ↓
API: /api/trading/confirm (POST)
- Release funds to borrower
- Update ticket status to 'Active'
- Start repayment schedule
- Send confirmation notifications

┌─────────────────────────────────────────────────────────────┐
│  Step 5: Repayment                                          │
└─────────────────────────────────────────────────────────────┘
On due date:
- Borrower repays: amount + interest
- 20% interest total:
    - 5% to investor wallet
    - 15% to investor bank account (auto-payout)
- 25% repayment fee to platform
- Update escrow status to 'Completed'
- Release locked funds
- Record transaction
```

**Validation Rules:**

```typescript
// Loan/Investment limits based on membership tier
const validateAmount = (tier: string, amount: number, type: 'loan' | 'investment') => {
  const limits = {
    Basic: { loan: 500, investment: 5000 },
    Ambassador: { loan: 1000, investment: 10000 },
    VIP: { loan: 5000, investment: 50000 },
    Business: { loan: 10000, investment: 100000 }
  };
  
  const limit = type === 'loan' ? limits[tier].loan : limits[tier].investment;
  return amount <= limit;
};
```

### P2P Transfer System

**Page:** `/dashboard/p2p`

**Flow:**
```
User initiates P2P transfer
                ↓
Select recipient (by email or phone)
Enter amount
Optional: Add message
                ↓
Validate:
- Sufficient balance
- Recipient exists and verified
- Not self-transfer
                ↓
Create P2P transaction:
{
  senderId: string,
  receiverId: string,
  amount: number,
  fee: 10, // R10 flat fee
  status: 'pending',
  message: string,
  createdAt: timestamp
}
                ↓
Deduct: amount + fee from sender wallet
Add: amount to receiver wallet
                ↓
Send notifications to both parties
Record in transaction history
```

**Transaction Fee:** R10 per user-initiated transaction

### Cryptocurrency Swap (Phase 4)

**Page:** `/dashboard/swap`  
**Service:** `src/lib/crypto-wallet-service.ts`

**Supported Coins:**
- Bitcoin (BTC)
- Ethereum (ETH)
- Tether (USDT)

**Swap Process:**
```
User selects:
- From coin (e.g., BTC)
- To coin (e.g., ETH)
- Amount
                ↓
Fetch real-time exchange rates
Display: conversion amount + fees
                ↓
User confirms swap
                ↓
Execute swap:
- Deduct from_coin balance
- Add to_coin balance
- Record swap transaction
- Apply swap fee (0.5%)
```

---

## 9. Admin & Support Workflows

### Admin Dashboard

**Route:** `/dashboard/admin`  
**Component:** `src/components/AdminDashboard.tsx`

**Overview Cards:**
- Total Users
- Active Transactions
- Pending Disputes
- Platform Revenue
- System Health Status

### User Management

**Route:** `/dashboard/admin/users`

**Features:**
1. **User List**
   - Search by name, email, phone
   - Filter by:
     - Membership tier
     - Account status (active, suspended, pending verification)
     - Registration date range
     - KYC status
   - Sort by: name, email, join date, balance

2. **User Actions**
   - View full profile
   - Edit user details
   - Change membership tier
   - Suspend/activate account
   - Reset password (send email)
   - View transaction history
   - View referral tree
   - Add internal notes

3. **Bulk Operations**
   - Export user list (CSV/Excel)
   - Send bulk notifications
   - Bulk tier upgrades (promotional)

**Implementation:**
```tsx
// Admin user management
const handleUserAction = async (userId: string, action: string) => {
  switch(action) {
    case 'suspend':
      await adminDb.collection('users').doc(userId).update({
        status: 'suspended',
        suspendedAt: FieldValue.serverTimestamp()
      });
      break;
    
    case 'changeTier':
      await membershipService.upgradeMembership(userId, newTier);
      break;
    
    case 'viewTransactions':
      const transactions = await getTransactionHistory(userId);
      // Display in modal
      break;
  }
};
```

### Transaction Monitoring

**Route:** `/dashboard/admin/transaction-monitoring`

**Features:**

1. **Real-Time Feed**
   - Live transaction stream (Firestore onSnapshot)
   - Transaction types: Deposit, Withdrawal, P2P, Trade, Swap
   - Color-coded by type and status

2. **Flagged Transactions**
   - ML fraud detection alerts (Phase 4)
   - High-value transactions (> R50,000)
   - Unusual patterns (rapid deposits/withdrawals)
   - First-time large transactions

3. **Manual Review Queue**
   - Admin can approve/reject pending transactions
   - Add investigation notes
   - Request additional verification
   - Flag user account

4. **Filters & Search**
   - By date range
   - By user
   - By transaction type
   - By amount range
   - By status

**Risk Scoring:**

```typescript
// Transaction risk assessment
const assessTransactionRisk = (transaction: Transaction) => {
  let riskScore = 0;
  
  // Amount-based risk
  if (transaction.amount > 50000) riskScore += 30;
  else if (transaction.amount > 10000) riskScore += 15;
  
  // User history
  if (userTransactionCount < 5) riskScore += 20;
  
  // Time-based patterns
  if (rapidTransactions) riskScore += 25;
  
  // Location mismatch
  if (locationChanged) riskScore += 15;
  
  return {
    score: riskScore,
    level: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low'
  };
};
```

### Dispute Resolution

**Route:** `/dashboard/admin/disputes`  
**Service:** `src/lib/dispute-resolution-service.ts`

**Dispute Types:**
- Payment not received
- Incorrect amount
- Fraudulent transaction
- Trading disagreement
- Escrow issues

**Dispute Lifecycle:**

```
User creates dispute → 'Open' status
                             ↓
           /api/disputes/create (POST)
           Creates dispute record in Firestore
                             ↓
        Admin reviews dispute details
        - View transaction history
        - Check escrow status
        - Review evidence uploaded by parties
        - Contact both parties via messaging
                             ↓
        Admin assigns arbitrator (if needed)
        Status: 'Under Investigation'
                             ↓
        Gather evidence:
        - Transaction screenshots
        - Communication logs
        - Bank statements
        - KYC documents
                             ↓
        Admin makes decision:
        - Refund to buyer
        - Release to seller
        - Partial refund
        - No action (dismiss)
                             ↓
        Execute resolution:
        - Adjust wallet balances
        - Release escrow funds
        - Record resolution notes
        - Update dispute status: 'Resolved'
                             ↓
        Notify all parties:
        - Send outcome notification
        - Update transaction record
        - Add to user's dispute history
                             ↓
        Close dispute
        Generate resolution report
```

**Dispute Priority:**
- **High:** Transactions > R10,000
- **Medium:** Active escrow involved
- **Low:** General inquiries

### System Monitoring

**Route:** `/dashboard/admin/monitoring`

**Metrics Tracked:**

1. **User Metrics**
   - Total users
   - New signups (daily/weekly/monthly)
   - Active users (last 30 days)
   - Churn rate
   - Tier distribution

2. **Financial Metrics**
   - Total platform balance
   - Total deposits (daily/weekly/monthly)
   - Total withdrawals
   - Average transaction size
   - Revenue from fees
   - Revenue from security deposits (admin fees)

3. **Trading Metrics**
   - Active tickets
   - Matched trades
   - Trades in escrow
   - Completed trades
   - Default rate
   - Average interest rate

4. **System Health**
   - API response times
   - Error rates
   - Firestore read/write counts
   - Firebase Auth success rate
   - Payment gateway uptime

5. **Security Metrics**
   - Failed login attempts
   - Suspended accounts
   - Flagged transactions
   - Open disputes
   - KYC verification backlog

**Dashboard Charts:**
- Line chart: User growth over time
- Bar chart: Revenue by source
- Pie chart: Membership tier distribution
- Area chart: Transaction volume trends

---

## 10. Feature Integration Map

### Phase 1-3 Features (Production)

| Feature | Status | Components | Services | Pages |
|---------|--------|------------|----------|-------|
| **Authentication** | ✅ Complete | AuthProvider, LoginForm | auth-service, auth-utils | /auth, /auth/signup, /auth/verify-email |
| **Wallet Management** | ✅ Complete | WalletManagement | wallet-service, transaction-service | /dashboard/wallet |
| **Trading System** | ✅ Complete | CoinTrading | trading-service | /dashboard/trading |
| **P2P Transfers** | ✅ Complete | P2PTransfer | p2p-service | /dashboard/p2p |
| **Referral Program** | ✅ Complete | ReferralDashboard, ReferralNotifier | referral-service, notification-service | /dashboard/referral, /dashboard/commissions |
| **Membership Tiers** | ✅ Complete | MembershipManagement | membership-service, paystack-service | /dashboard/membership |
| **KYC Verification** | ✅ Complete | KYCVerification | kyc-service | /dashboard/kyc |
| **Dispute Resolution** | ✅ Complete | DisputeForm | dispute-resolution-service | /dashboard/disputes, /dashboard/admin/disputes |
| **Risk Assessment** | ✅ Complete | RiskAssessmentTool | risk-assessment-service | /dashboard/risk |
| **Security & 2FA** | ✅ Complete | SecuritySettings | auth-service (MFA methods) | /dashboard/security |
| **Notifications** | ✅ Complete | NotificationCenter, ReferralNotifier | notification-service | /dashboard/notifications |
| **Payment Receipts** | ✅ Complete | ReceiptViewer | receipt-service | /dashboard/receipts |
| **AI Summarization** | ✅ Complete | SummaryComponent | ai-service | /dashboard (embedded) |
| **Admin Dashboard** | ✅ Complete | AdminDashboard | admin-service | /dashboard/admin |
| **Transaction Monitoring** | ✅ Complete | TransactionMonitor | transaction-service | /dashboard/admin/transaction-monitoring |

### Phase 4 Features (Recently Added)

| Feature | Status | Components | Services | Pages |
|---------|--------|------------|----------|-------|
| **In-App Messaging** | ✅ Implemented | MessageList, ChatWindow | messaging-service (WebSocket, encryption) | /dashboard/messages |
| **ID Verification** | ✅ Implemented | IDVerificationForm | id-verification-service (Smile Identity API) | /dashboard/kyc (integrated) |
| **Crypto Wallet** | ✅ Implemented | CryptoWalletDisplay | crypto-wallet-service (BTC, ETH, USDT) | /dashboard/wallet (extended) |
| **Advanced Analytics** | ✅ Implemented | AnalyticsDashboard | user-analytics-service (portfolio tracking) | /dashboard/analytics |
| **Multi-Currency** | ✅ Implemented | CurrencySelector | multi-currency-service (50+ currencies) | /dashboard/wallet (selector) |
| **ML Fraud Detection** | ✅ Implemented | FraudAlertBanner | ml-fraud-detection-service (anomaly detection) | /dashboard/admin/transaction-monitoring |
| **Mobile App Foundation** | ✅ PWA Ready | PWAInstallPrompt | service-worker, manifest.json | All pages (offline support) |

**New Services Added:**

1. **messaging-service.ts** - Real-time chat with WebSocket, message encryption
2. **id-verification-service.ts** - Smile Identity integration for passport/ID scanning
3. **crypto-wallet-service.ts** - Multi-coin wallet with real-time price tracking
4. **user-analytics-service.ts** - Portfolio analytics, performance tracking
5. **multi-currency-service.ts** - 50+ fiat currencies with live exchange rates
6. **ml-fraud-detection-service.ts** - Machine learning anomaly detection, pattern recognition

---

## 11. Gap Analysis & Missing Components

### ⚠️ Missing Pages/Features

#### 1. **Admin Support Ticket Management**
**Status:** 🔴 Missing  
**Expected Route:** `/dashboard/admin/support-tickets`  
**Description:** Dedicated admin interface to view, assign, and respond to user support tickets.

**Recommended Implementation:**
- List all support tickets with filters (open, in-progress, resolved)
- Assign tickets to support agents
- Internal notes for admins
- Escalation workflow
- Response templates
- SLA tracking

#### 2. **Comprehensive Analytics Export**
**Status:** 🟡 Partial  
**Current:** Analytics export exists for transaction data  
**Missing:** Complete platform analytics export for admins (user growth, revenue, trading metrics)

**Recommended Implementation:**
- Admin analytics dashboard export (CSV, Excel, PDF)
- Scheduled reports (daily/weekly/monthly)
- Custom date range selection
- Visualization exports (charts as images)

#### 3. **Mobile App Native Features**
**Status:** 🟡 Partial  
**Current:** PWA foundation is ready (service worker, manifest)  
**Missing:** Native mobile app (React Native or Flutter)

**Recommended Implementation:**
- Native iOS app (React Native)
- Native Android app (React Native)
- Push notifications (Firebase Cloud Messaging)
- Biometric authentication (fingerprint, face ID)
- Native camera integration for KYC

#### 4. **Bank Account Verification**
**Status:** 🔴 Missing  
**Description:** Verify user bank account details before processing withdrawals.

**Recommended Implementation:**
- Paystack Bank Verification API integration
- Micro-deposit verification method
- BVN (Bank Verification Number) check for South African accounts
- Store verified bank accounts in Firestore

#### 5. **Automated Tax Reporting**
**Status:** 🔴 Missing  
**Description:** Generate tax forms for users (1099, W2, or South African equivalent).

**Recommended Implementation:**
- Calculate taxable income from investments
- Generate annual tax statements
- Export tax reports (PDF)
- Integrate with SARS (South African Revenue Service) if possible

#### 6. **Loan Repayment Reminders**
**Status:** 🟡 Partial  
**Current:** Notifications service exists  
**Missing:** Automated loan repayment reminders via email and SMS

**Recommended Implementation:**
- Schedule reminders (7 days, 3 days, 1 day before due date)
- SMS integration (Twilio or similar)
- Email templates for reminders
- Overdue notices

#### 7. **Referral Analytics Dashboard**
**Status:** 🟡 Partial  
**Current:** Basic referral tracking exists  
**Missing:** Detailed analytics (conversion rates, top referrers, referral tree visualization)

**Recommended Implementation:**
- Referral tree visualization (hierarchical graph)
- Conversion funnel analytics
- Leaderboard for top referrers
- Referral performance over time (charts)

#### 8. **API Key Management for Business Tier**
**Status:** 🔴 Missing  
**Description:** Business tier users should have access to API keys for programmatic trading.

**Recommended Implementation:**
- Generate API keys for Business tier users
- API documentation (Swagger/OpenAPI)
- Rate limiting per API key
- Usage analytics per API key

#### 9. **Multi-Factor Authentication (MFA) Setup Flow**
**Status:** 🟡 Partial  
**Current:** MFA methods exist in AuthProvider  
**Missing:** Complete setup wizard for SMS, email, and authenticator app MFA

**Recommended Implementation:**
- MFA setup wizard in `/dashboard/security`
- QR code generation for authenticator apps (Google Authenticator, Authy)
- SMS verification via Twilio
- Backup codes generation
- Recovery flow for lost MFA device

#### 10. **Community Forum / Help Center**
**Status:** 🔴 Missing  
**Expected Route:** `/community` or `/help-center`  
**Description:** User-generated Q&A, knowledge base articles, community discussions.

**Recommended Implementation:**
- Forum categories (Trading Tips, Technical Support, General Discussion)
- Voting system for helpful answers
- Admin moderation tools
- Search functionality
- Markdown support for posts

### 🟢 Complete Features (No Gaps)

- ✅ User authentication (signup, login, password reset, email verification)
- ✅ Dashboard with wallet balance, quick actions, recent transactions
- ✅ Coin trading (invest/borrow with escrow)
- ✅ P2P transfers
- ✅ Wallet management (deposit, withdrawal, transaction history)
- ✅ Membership tier system with security deposits
- ✅ Referral program with commission tracking
- ✅ KYC verification workflow
- ✅ Risk assessment tool
- ✅ Dispute resolution system
- ✅ Admin dashboard (user management, transaction monitoring, disputes)
- ✅ Notifications system
- ✅ Payment receipts
- ✅ Security settings (password change, session management)
- ✅ Transaction export (CSV)
- ✅ In-app messaging (Phase 4)
- ✅ ID verification (Phase 4)
- ✅ Crypto wallet (Phase 4)
- ✅ Advanced analytics (Phase 4)
- ✅ Multi-currency support (Phase 4)
- ✅ ML fraud detection (Phase 4)

---

## 12. Recommendations

### High Priority (Implement Next)

1. **Complete Admin Support Ticket System**
   - Create `/dashboard/admin/support-tickets` page
   - Build ticket assignment and tracking workflow
   - Add internal notes and escalation features
   - **Estimated Time:** 2-3 days

2. **Bank Account Verification**
   - Integrate Paystack Bank Verification API
   - Add bank account management in user profile
   - Validate accounts before processing withdrawals
   - **Estimated Time:** 3-4 days

3. **Loan Repayment Reminders**
   - Build automated reminder system
   - Integrate SMS service (Twilio)
   - Create email templates for reminders
   - Schedule cron jobs for daily checks
   - **Estimated Time:** 2-3 days

4. **MFA Setup Wizard**
   - Complete MFA setup flow in `/dashboard/security`
   - Add QR code generation for authenticator apps
   - Implement SMS verification
   - Generate backup codes
   - **Estimated Time:** 3-4 days

5. **Referral Analytics Enhancement**
   - Build referral tree visualization
   - Add conversion funnel analytics
   - Create leaderboard for top referrers
   - **Estimated Time:** 2-3 days

### Medium Priority (Next Quarter)

6. **Native Mobile Apps**
   - Build React Native apps for iOS and Android
   - Implement push notifications
   - Add biometric authentication
   - Native camera for KYC
   - **Estimated Time:** 6-8 weeks

7. **API Key Management for Business Tier**
   - Create API key generation system
   - Build API documentation (Swagger)
   - Implement rate limiting
   - Add usage analytics
   - **Estimated Time:** 4-5 days

8. **Community Forum**
   - Build forum categories and posts system
   - Add voting and moderation features
   - Implement search functionality
   - **Estimated Time:** 2-3 weeks

9. **Automated Tax Reporting**
   - Calculate taxable income from investments
   - Generate annual tax statements
   - Export tax reports (PDF)
   - **Estimated Time:** 1-2 weeks

10. **Comprehensive Analytics Export for Admins**
    - Build admin analytics export functionality
    - Add scheduled reports
    - Create visualization exports
    - **Estimated Time:** 3-4 days

### Low Priority (Future Enhancements)

11. **Advanced Trading Features**
    - Limit orders (set price and wait for match)
    - Stop-loss orders
    - Recurring investments (auto-invest monthly)
    - Portfolio diversification recommendations

12. **Social Features**
    - User profiles (public view)
    - Follow other traders
    - Copy trading (mirror successful traders' strategies)
    - Trading leaderboard

13. **Educational Content**
    - Video tutorials on trading strategies
    - Interactive courses on financial literacy
    - Quizzes with rewards
    - Certification program

14. **Insurance & Protection**
    - Optional transaction insurance
    - Deposit protection scheme
    - Fraud guarantee program

15. **White-Label Solution for Business Tier**
    - Allow businesses to brand their own trading platform
    - Custom domain support
    - Branded mobile apps

---

## Appendix A: Database Schema

### Firestore Collections

```
users/
  {userId}
    - email: string
    - fullName: string
    - phone: string
    - role: 'user' | 'support' | 'admin'
    - membershipTier: 'Basic' | 'Ambassador' | 'VIP' | 'Business'
    - status: 'active' | 'suspended' | 'pending'
    - emailVerified: boolean
    - kycStatus: 'pending' | 'verified' | 'rejected'
    - referralCode: string
    - referredBy: string (referral code of referrer)
    - createdAt: timestamp
    - lastLogin: timestamp

wallets/
  {userId}
    - balance: number
    - lockedBalance: number
    - currency: string
    - lastUpdated: timestamp
    - transactions/ (subcollection)
        {transactionId}
          - type: 'Deposit' | 'Withdrawal' | 'P2P' | 'Trade' | 'Fee'
          - amount: number
          - status: 'pending' | 'completed' | 'failed'
          - method: string
          - reference: string
          - createdAt: timestamp

tickets/
  {ticketId}
    - userId: string
    - type: 'Invest' | 'Borrow'
    - amount: number
    - interest: number
    - duration: number
    - status: 'Open' | 'Matched' | 'Escrow' | 'Completed' | 'Cancelled'
    - membershipTier: string
    - riskScore: number
    - matchedTicketId: string
    - createdAt: timestamp
    - updatedAt: timestamp

escrow/
  {escrowId}
    - ticketId: string
    - investorId: string
    - borrowerId: string
    - amount: number
    - interest: number
    - repaymentAmount: number
    - status: 'Pending' | 'Active' | 'Completed' | 'Disputed'
    - dueDate: timestamp
    - createdAt: timestamp

disputes/
  {disputeId}
    - ticketId: string
    - reporterId: string
    - reportedUserId: string
    - reason: string
    - evidence: string[]
    - status: 'Open' | 'Under Investigation' | 'Resolved' | 'Closed'
    - assignedTo: string (admin/arbitrator ID)
    - resolution: string
    - createdAt: timestamp
    - resolvedAt: timestamp

user_memberships/
  {userId}
    - currentTier: string
    - securityDeposit: number
    - joinDate: timestamp
    - renewalDate: timestamp
    - paymentStatus: 'active' | 'pending' | 'overdue'
    - metrics:
        - monthlyTradingVolume: number
        - totalReferrals: number
        - successfulReferrals: number

referrals/
  {referralId}
    - referrerId: string
    - referredUserId: string
    - referralCode: string
    - status: 'pending' | 'completed'
    - commissionEarned: number
    - commissionPaid: boolean
    - createdAt: timestamp

notifications/
  {notificationId}
    - userId: string
    - type: 'transaction' | 'system' | 'alert' | 'trading' | 'referral'
    - title: string
    - message: string
    - read: boolean
    - priority: 'low' | 'medium' | 'high'
    - metadata: object
    - createdAt: timestamp

messages/
  {conversationId}
    - participants: string[] (user IDs)
    - lastMessage: string
    - lastMessageAt: timestamp
    - unreadCount: { [userId]: number }
    - messages/ (subcollection)
        {messageId}
          - senderId: string
          - text: string (encrypted)
          - timestamp: timestamp
          - read: boolean
```

---

## Appendix B: API Routes Reference

### Authentication Routes

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/auth/signup` | Complete user signup after payment | `{ temporaryId, password, paymentReference }` | `{ success, userId, message }` |
| POST | `/api/auth/create-pending-user` | Create pending user before payment | `{ fullName, email, phone, referralCode, membershipTier }` | `{ temporaryId, expectedAmountKobo }` |
| POST | `/api/auth/verify-email` | Verify email token | `{ token }` | `{ success, message }` |
| POST | `/api/auth/reset-password` | Send password reset email | `{ email }` | `{ success, message }` |

### Payment Routes

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/payments/initialize` | Initialize Paystack payment | `{ userId, email, amount, type }` | `{ authorization_url, reference }` |
| POST | `/api/payments/verify` | Verify payment status | `{ reference }` | `{ status, amount, metadata }` |
| POST | `/api/webhooks/paystack` | Paystack webhook handler | Paystack payload | `{ received: true }` |

### Trading Routes

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/trading/create` | Create trade ticket | `{ userId, type, amount, interest, duration }` | `{ ticket }` |
| POST | `/api/trading/match` | Find matching ticket | `{ ticketId }` | `{ match }` |
| POST | `/api/trading/confirm` | Confirm trade | `{ ticketId }` | `{ success }` |
| POST | `/api/trading/cancel` | Cancel ticket | `{ ticketId }` | `{ success }` |

### Wallet Routes

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/wallet/withdraw` | Request withdrawal | `{ userId, amount, bankDetails }` | `{ transactionId }` |
| GET | `/api/wallet/balance` | Get wallet balance | Query: `userId` | `{ balance, lockedBalance }` |
| GET | `/api/wallet/transactions` | Get transaction history | Query: `userId, limit, offset` | `{ transactions, hasMore }` |

### Dispute Routes

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/disputes/create` | Create dispute | `{ ticketId, reason, evidence }` | `{ disputeId }` |
| POST | `/api/disputes/resolve` | Resolve dispute (admin) | `{ disputeId, resolution, action }` | `{ success }` |

### Admin Routes

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/admin/users` | Get all users | Query: `filters, page, limit` | `{ users, total }` |
| PUT | `/api/admin/users/:userId` | Update user | `{ updates }` | `{ success }` |
| POST | `/api/admin/users/:userId/suspend` | Suspend user | `{ reason }` | `{ success }` |
| GET | `/api/admin/transactions` | Get all transactions | Query: `filters, page, limit` | `{ transactions, total }` |
| GET | `/api/admin/analytics` | Get platform analytics | Query: `dateRange` | `{ metrics }` |

---

## Appendix C: Environment Variables

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=

# Smile Identity (Phase 4)
SMILE_IDENTITY_PARTNER_ID=
SMILE_IDENTITY_API_KEY=

# Cryptocurrency APIs (Phase 4)
CRYPTO_API_KEY=

# Email Service
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# SMS Service (for MFA and notifications)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# NextAuth (if using)
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# App Config
NEXT_PUBLIC_APP_URL=https://coinbox.co.za
NODE_ENV=production
```

---

## Appendix D: Testing Coverage

### Current Test Statistics

- **Total Tests:** 220
- **Passing:** 220 (100%)
- **Coverage:** 86.29%

### Test Categories

| Category | Tests | Status | Coverage |
|----------|-------|--------|----------|
| Authentication | 35 | ✅ All Pass | 92% |
| Wallet Management | 28 | ✅ All Pass | 88% |
| Trading System | 42 | ✅ All Pass | 85% |
| P2P Transfers | 18 | ✅ All Pass | 84% |
| Referral System | 22 | ✅ All Pass | 87% |
| Membership | 15 | ✅ All Pass | 90% |
| Dispute Resolution | 12 | ✅ All Pass | 82% |
| Risk Assessment | 10 | ✅ All Pass | 86% |
| Admin Features | 20 | ✅ All Pass | 85% |
| Notifications | 8 | ✅ All Pass | 88% |
| Phase 4 Features | 10 | ✅ All Pass | 78% |

### E2E Test Scenarios

1. Complete signup flow (4 steps + payment)
2. Login and dashboard access
3. Deposit funds via Paystack
4. Create investment ticket
5. Match with borrow ticket
6. Complete trade in escrow
7. P2P transfer between users
8. Withdraw funds
9. Create and resolve dispute
10. Admin user management workflow

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | System Architect | Initial comprehensive workflow documentation |

---

**End of Comprehensive System Workflow Document**
