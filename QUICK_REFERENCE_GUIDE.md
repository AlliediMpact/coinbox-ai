# CoinBox AI - Quick Reference Guide

**Version:** 2.0.0 | **Last Updated:** 2024

---

## 📖 Document Index

This workspace now contains comprehensive system documentation:

| Document | Lines | Purpose | Location |
|----------|-------|---------|----------|
| **Comprehensive System Workflow** | 800+ | Complete system documentation | `/COMPREHENSIVE_SYSTEM_WORKFLOW.md` |
| **System Architecture Diagrams** | 1000+ | Visual flow charts and diagrams | `/SYSTEM_ARCHITECTURE_DIAGRAM.md` |
| **Gap Analysis & Roadmap** | 1200+ | Identified gaps with implementation plans | `/GAP_ANALYSIS_AND_ROADMAP.md` |
| **Analysis Summary** | 300+ | Executive summary and findings | `/ANALYSIS_SUMMARY.md` |
| **This Guide** | 100+ | Quick reference and navigation | `/QUICK_REFERENCE_GUIDE.md` |

**Total Documentation:** 3,400+ lines

---

## 🚀 Quick Start for Developers

### Understanding the Platform

1. **New to the project?** Start with `/ANALYSIS_SUMMARY.md`
2. **Need to understand a workflow?** Check `/COMPREHENSIVE_SYSTEM_WORKFLOW.md`
3. **Want to see the big picture?** View `/SYSTEM_ARCHITECTURE_DIAGRAM.md`
4. **Planning next features?** Review `/GAP_ANALYSIS_AND_ROADMAP.md`

### Key Entry Points

```bash
# Landing Page (Anonymous Users)
src/app/page.tsx

# Authentication
src/app/auth/              # Login/Signup
src/app/auth/signup/page.tsx     # 4-step signup wizard
src/app/auth/complete-signup/page.tsx

# Main Dashboard
src/app/dashboard/page.tsx

# Admin Dashboard
src/app/dashboard/admin/page.tsx
```

---

## 📋 Common Tasks

### Finding a Specific Page

```bash
# All pages are in src/app/
find src/app -name "page.tsx" | sort

# Key pages:
/src/app/page.tsx                          # Landing
/src/app/dashboard/page.tsx                # Dashboard
/src/app/dashboard/wallet/page.tsx         # Wallet
/src/app/dashboard/trading/page.tsx        # Trading
/src/app/dashboard/p2p/page.tsx            # P2P
/src/app/dashboard/admin/users/page.tsx    # Admin Users
```

### Finding a Service

```bash
# All services are in src/lib/
ls src/lib/*-service.ts

# Key services:
src/lib/auth-service.ts          # Authentication
src/lib/wallet-service.ts        # Wallet operations
src/lib/trading-service.ts       # Trading/escrow
src/lib/paystack-service.ts      # Payments
src/lib/messaging-service.ts     # In-app messaging (Phase 4)
```

### Finding an API Route

```bash
# All API routes are in src/app/api/
find src/app/api -name "route.ts"

# Key routes:
/api/auth/signup              # POST - Complete signup
/api/auth/create-pending-user # POST - Initiate signup
/api/payments/initialize      # POST - Start payment
/api/trading/create           # POST - Create ticket
/api/trading/match            # POST - Find match
```

---

## 🎯 Platform Overview (One-Glance)

### What is CoinBox?

P2P lending/investment platform for South African market (ZAR) with:
- 4 membership tiers (Basic → Ambassador → VIP → Business)
- Invest/Borrow trading system with escrow
- Wallet management (deposit/withdraw/P2P transfer)
- Referral program with commissions
- Admin dashboard for platform management
- 7 new advanced features (Phase 4): messaging, crypto wallet, ID verification, ML fraud detection, etc.

### Key Numbers

- **52 Pages** across auth, dashboard, admin, marketing
- **70+ Services** powering the platform
- **16 Features** fully implemented
- **220 Tests** all passing (100%)
- **86% Coverage**
- **4 Membership Tiers** with different limits
- **20+ API Routes**

---

## 🔐 User Roles

| Role | Access | Key Routes |
|------|--------|------------|
| **User** | Own dashboard, trading, wallet, referrals | `/dashboard/*` |
| **Support** | View users, manage tickets, view transactions | `/dashboard/admin/support-tickets` |
| **Admin** | Full platform access, user management, disputes, monitoring | `/dashboard/admin/*` |

**Role Check:**
```typescript
// Server-side
import { hasAdminAccess } from '@/lib/auth-utils';
const isAdmin = await hasAdminAccess(userId);

// Client-side
import { useAuth } from '@/components/AuthProvider';
const { user } = useAuth();
// Check user.customClaims.role or fetch from Firestore
```

---

## 💰 Membership Tiers Quick Reference

| Tier | Fee | Loan | Investment | Commission | Key Feature |
|------|-----|------|------------|------------|-------------|
| **Basic** | R550 | R500 | R5K | 1% | Starter tier |
| **Ambassador** | R1.1K | R1K | R10K | 2% | Higher limits |
| **VIP** | R5.5K | R5K | R50K | 3% | Premium support |
| **Business** | R11K | R10K | R100K | 5% | Enterprise features |

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** Firebase Admin not working in client components  
**Solution:** Use API routes instead. Import firebase-admin only in `/api/*` routes.

**Issue:** Module not found: @/lib/...  
**Solution:** Check `tsconfig.json` for path aliases. Restart TS server.

**Issue:** Tests failing with Firebase error  
**Solution:** Ensure Firebase emulators are running: `firebase emulators:start`

**Issue:** Paystack payment not working  
**Solution:** Check `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in `.env.local`

---

## 📚 Key Concepts

### Signup Flow (4 Steps)
1. **Account Details** - Name, email, phone, referral code
2. **Password** - 5 requirements (length, uppercase, lowercase, number, special)
3. **Tier Selection** - Choose membership tier
4. **Payment** - Paystack payment for security deposit

### Trading Flow (Ticket-Based)
1. User creates "Invest" or "Borrow" ticket
2. System matches opposite tickets (Invest ↔ Borrow)
3. Escrow locks investor's funds
4. Funds released to borrower on confirmation
5. Borrower repays with interest on due date

### Wallet Operations
- **Deposit** - Via Paystack (card payment)
- **Withdrawal** - To verified bank account (admin approval)
- **P2P Transfer** - Direct user-to-user transfer (R10 fee)
- **Balance Types** - Available balance + Locked balance (in escrow)

---

## 🎯 Gap Summary (What's Missing)

### Critical (Fix Now)
1. 🔴 Bank Account Verification
2. 🔴 Loan Repayment Automation
3. 🔴 Admin Support Ticket Interface

### High Priority (Fix Soon)
4. 🟡 MFA Setup Wizard
5. 🟡 Referral Analytics Dashboard
6. 🟡 Admin Analytics Export

### Nice-to-Have (Future)
7. 🟢 Native Mobile App
8. 🟢 Tax Reporting
9. 🟢 API Keys (Business Tier)
10. 🟢 Community Forum

**Detailed plans in:** `/GAP_ANALYSIS_AND_ROADMAP.md`

---

## 📞 Support & Resources

### Documentation
- **Full System Docs:** `/COMPREHENSIVE_SYSTEM_WORKFLOW.md`
- **Architecture Diagrams:** `/SYSTEM_ARCHITECTURE_DIAGRAM.md`
- **Gap Analysis:** `/GAP_ANALYSIS_AND_ROADMAP.md`
- **README:** `/README.md` (overview + setup)

### External Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Paystack API](https://paystack.com/docs/api/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Radix UI Docs](https://www.radix-ui.com/)

### Project Structure
```
coinbox-ai/
├── src/
│   ├── app/                 # Next.js pages (App Router)
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # User dashboard
│   │   └── page.tsx        # Landing page
│   ├── components/          # React components
│   ├── lib/                 # Services and utilities
│   ├── middleware/          # Next.js middleware
│   └── tests/               # Test files
├── public/                  # Static assets
├── docs/                    # Additional documentation
├── COMPREHENSIVE_SYSTEM_WORKFLOW.md
├── SYSTEM_ARCHITECTURE_DIAGRAM.md
├── GAP_ANALYSIS_AND_ROADMAP.md
├── ANALYSIS_SUMMARY.md
├── QUICK_REFERENCE_GUIDE.md
└── README.md
```

---

## ✅ Quick Health Check

Run this to verify everything is working:

```bash
# 1. Install dependencies
npm install

# 2. Check environment variables
cat .env.local | grep -E "FIREBASE|PAYSTACK"

# 3. Run tests
npm test

# 4. Build
npm run build

# 5. Start dev server
npm run dev
```

**Expected Results:**
- ✅ All dependencies installed
- ✅ Environment variables present
- ✅ 220/220 tests passing
- ✅ Build succeeds
- ✅ Dev server starts at http://localhost:3000

---

## 🎓 Learning Path for New Developers

### Day 1: Understanding the Platform
- Read `/ANALYSIS_SUMMARY.md` (30 min)
- Explore `/SYSTEM_ARCHITECTURE_DIAGRAM.md` (30 min)
- Browse the codebase structure (30 min)

### Day 2: Deep Dive into Workflows
- Read `/COMPREHENSIVE_SYSTEM_WORKFLOW.md` sections 1-6 (2 hours)
- Trace signup flow: `src/app/auth/signup/page.tsx` → API → Firestore
- Trace dashboard flow: `src/app/dashboard/page.tsx` → Components

### Day 3: Service Layer
- Explore services in `src/lib/`
- Read key services: auth-service, wallet-service, trading-service
- Understand Firestore schema (Appendix A in workflow doc)

### Day 4: Admin Features
- Explore admin pages: `src/app/dashboard/admin/`
- Understand role-based access control
- Review admin workflows in documentation

### Day 5: Hands-On
- Set up local environment
- Run tests
- Make a small feature enhancement
- Review gaps in `/GAP_ANALYSIS_AND_ROADMAP.md`

---

**Last Updated:** 2024  
**Documentation Version:** 1.0  
**Platform Version:** 2.0.0

