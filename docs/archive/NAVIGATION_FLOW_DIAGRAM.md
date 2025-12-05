# 🗺️ Navigation Flow Diagram

## Complete Site Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│                         HOME PAGE (/)                        │
│                                                              │
│  • Unauthenticated: Show landing with Sign In/Sign Up      │
│  • Authenticated: Auto-redirect to /dashboard              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─── Not Logged In ──→ /auth
                              │
                              └─── Logged In ──────→ /dashboard
                                                      │
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD (/dashboard)                    │
│                                                              │
│  Main Hub - Shows:                                          │
│  • Wallet Balance                                           │
│  • Commission Balance                                       │
│  • Recent Transactions                                      │
│  • Quick Actions                                            │
│  • Risk Assessment                                          │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
    
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ USER NAVIGATION │  │ SETTINGS/PROFILE│  │ ADMIN NAVIGATION│
└─────────────────┘  └─────────────────┘  └─────────────────┘


═══════════════════════════════════════════════════════════════
USER NAVIGATION (All Users)
═══════════════════════════════════════════════════════════════

/dashboard/trading
├─ Coin Trading
├─ Buy/Sell Interface
├─ P2P Trading
└─ Transaction History

/dashboard/wallet
├─ Wallet Management
├─ Deposit Funds
├─ Withdraw Funds
└─ Transaction History

/dashboard/receipts
├─ Payment Receipts
├─ Download PDF
└─ Email Receipts

/dashboard/disputes
├─ Open Disputes
├─ Create New Dispute
├─ View History
└─ Resolution Status

/dashboard/security
├─ Security Overview
├─ Change Password
├─ Session Management
└─ Security Logs
    └─ /dashboard/security/mfa
        ├─ Enable 2FA
        ├─ Disable 2FA
        └─ Backup Codes

/dashboard/risk
├─ Risk Assessment
├─ AI Risk Score
├─ Risk History
└─ Recommendations

/dashboard/referral
├─ Referral Dashboard
├─ Generate Referral Link
├─ View Referrals
└─ Earnings Tracker

/dashboard/support
├─ Support Tickets
├─ Create Ticket
├─ Live Chat
└─ Help Center


═══════════════════════════════════════════════════════════════
SETTINGS & PROFILE (All Users)
═══════════════════════════════════════════════════════════════

/dashboard/settings ⭐ NEW
├─ Notification Settings
│  ├─ Email Notifications
│  ├─ Trade Notifications
│  └─ Security Alerts
├─ Display & Regional
│  ├─ Language Selection
│  ├─ Currency Preference
│  └─ Theme (Light/Dark)
└─ Quick Actions
   ├─ → Change Password
   ├─ → Two-Factor Auth
   └─ → Edit Profile

/dashboard/profile
├─ Personal Information
├─ Contact Details
├─ Upload Avatar
└─ Account Settings

/dashboard/membership
├─ Current Tier
├─ Upgrade Options
├─ Benefits Comparison
└─ Payment History

/dashboard/kyc
├─ KYC Status
├─ Upload Documents
├─ Verification Status
└─ Resubmit (if rejected)

/dashboard/commissions
├─ Commission Earnings
├─ Breakdown by Referral
├─ Payout History
└─ Withdraw Commissions

/dashboard/payments
├─ Payment Methods
├─ Billing History
├─ Receipts
└─ Paystack Integration


═══════════════════════════════════════════════════════════════
ADMIN NAVIGATION (Admin & Support Roles Only)
═══════════════════════════════════════════════════════════════

/dashboard/admin
├─ Admin Dashboard
├─ System Overview
├─ User Statistics
└─ Platform Metrics

/dashboard/admin/users ⭐ NEW
├─ User List (Search/Filter)
├─ User Details
├─ Role Management
│  ├─ Make Admin
│  ├─ Make Support
│  └─ Make User
├─ User Status
│  ├─ Suspend User
│  └─ Activate User
└─ KYC Status Overview

/dashboard/admin/transaction-monitoring
├─ Real-time Transaction Feed
├─ Suspicious Activity Alerts
├─ Transaction Details
└─ Flag/Review Transactions

/dashboard/admin/disputes
├─ All Disputes (Global)
├─ Pending Reviews
├─ Assign to Support
├─ Resolve Dispute
└─ Escalation Management

/dashboard/analytics
├─ Platform Analytics
├─ Revenue Reports
├─ User Growth Metrics
├─ Transaction Volumes
└─ Export Reports

/dashboard/auth-management
├─ Auth System Monitoring
├─ Failed Login Attempts
├─ Session Management
├─ MFA Status Overview
└─ Security Events


═══════════════════════════════════════════════════════════════
PUBLIC/INFO PAGES (All Visitors)
═══════════════════════════════════════════════════════════════

/about
├─ Company Information
├─ Mission & Vision
├─ Team Members
└─ Company History

/contact
├─ Contact Form
├─ Office Locations
├─ Support Email
└─ Phone Numbers

/careers ⭐ NEW
├─ Open Positions
├─ Company Culture
├─ Benefits
└─ Application Form

/press ⭐ NEW
├─ Press Releases
├─ Media Kit
└─ Contact PR Team

/education/p2p-trading
├─ Trading Tutorial
├─ Best Practices
├─ Safety Tips
└─ Video Guides

/help-center ⭐ NEW
├─ Search Articles
├─ FAQ Categories
│  ├─ Getting Started
│  ├─ Security
│  ├─ Trading
│  └─ Account Management
├─ Video Tutorials
└─ Contact Support

/system-status
├─ Current Status
├─ Uptime Metrics
├─ Scheduled Maintenance
└─ Incident History


═══════════════════════════════════════════════════════════════
LEGAL PAGES (All Visitors)
═══════════════════════════════════════════════════════════════

/terms ⭐ NEW
└─ Terms of Service

/privacy ⭐ NEW
└─ Privacy Policy

/compliance ⭐ NEW
└─ Compliance Information

/cookies ⭐ NEW
└─ Cookie Policy

/security ⭐ NEW
└─ Security Information


═══════════════════════════════════════════════════════════════
AUTHENTICATION FLOWS
═══════════════════════════════════════════════════════════════

/auth
├─ Sign In Form
├─ Sign Up Form
├─ Password Reset
└─ Email Verification

/auth/login
└─ Dedicated Login Page

/auth/signup
└─ Dedicated Signup Page

/auth/complete-signup
└─ Post-registration setup

/auth/reset-password
└─ Password reset form

/auth/verify-email
└─ Email verification handler

/auth/otp
└─ OTP verification (2FA)

/auth/payment-callback
└─ Paystack payment handler


═══════════════════════════════════════════════════════════════
NAVIGATION BEHAVIORS
═══════════════════════════════════════════════════════════════

1. AUTHENTICATION-BASED REDIRECTION
   • Home (/) → Dashboard (if logged in)
   • Any protected route → /auth (if not logged in)
   • /auth → Dashboard (if already logged in)

2. ROLE-BASED VISIBILITY
   • Admin menu items only show if user.role === 'admin' or 'support'
   • Admin pages protected by RoleProtectedRoute
   • Unauthorized access redirects to /dashboard

3. ACTIVE STATE INDICATION
   • Current page highlighted in sidebar
   • Uses pathname matching
   • Visual feedback: bg-white/20 + font-semibold

4. MOBILE MENU
   • Hamburger toggle on mobile
   • Slide-in animation
   • Auto-close on navigation
   • Backdrop overlay

5. BREADCRUMBS (Future Enhancement)
   • Show navigation path
   • Clickable ancestors
   • Auto-generated from route


═══════════════════════════════════════════════════════════════
EXTERNAL LINKS
═══════════════════════════════════════════════════════════════

Social Media (Footer)
├─ Twitter: https://twitter.com/coinbox
├─ LinkedIn: https://linkedin.com/company/coinbox
├─ Facebook: https://facebook.com/coinboxapp
├─ GitHub: https://github.com/coinbox
└─ Email: contact@coinbox.com


═══════════════════════════════════════════════════════════════
SUMMARY STATISTICS
═══════════════════════════════════════════════════════════════

Total Pages: 40+
├─ User Pages: 15
├─ Admin Pages: 6
├─ Public Pages: 9
├─ Legal Pages: 5
├─ Auth Pages: 5
└─ New Pages Created: 10

Navigation Items:
├─ Main Sidebar: 9 items
├─ Admin Sidebar: 5 items
├─ Header Dropdowns: 4 items
└─ Footer Links: 16 items

Protection Levels:
├─ Public: 14 pages
├─ Authenticated: 20+ pages
├─ Admin/Support: 6 pages
└─ Auth Pages: 5 pages


═══════════════════════════════════════════════════════════════
KEY NOTES
═══════════════════════════════════════════════════════════════

✅ All navigation links tested and working
✅ No broken links or 404 errors
✅ Proper authentication gates
✅ Role-based access control
✅ Mobile-responsive navigation
✅ Active state indicators
✅ Loading states on protected routes
✅ Smooth transitions between pages

⭐ = Newly created pages
🔒 = Protected (requires login)
👑 = Admin only
🔐 = Role-protected route
```

---

**Last Updated:** November 29, 2025  
**Status:** Complete and Verified  
**Navigation System:** Fully Functional
