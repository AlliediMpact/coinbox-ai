# Allied iMpact Coin Box (PTY) Ltd

## Business Type
Peer-to-Peer (P2P) Financial Platform

## Vision Statement
To revolutionize peer-to-peer financial transactions by offering a secure, transparent, and efficient coin-based marketplace that empowers individuals and businesses to invest and loan digital assets with confidence.

## Mission Statement
To provide an innovative, user-friendly, and secure digital marketplace where users can trade coins effortlessly, access instant loans, and earn commissions through referrals, all while ensuring financial inclusivity and transparency.

---

## Implemented Features

### 1. Security Framework
- Advanced transaction monitoring system with real-time pattern detection
- Operation-specific rate limiting with sliding window implementation
- Security dashboard for both users and administrators
- Risk assessment integration for adaptive security controls
- Suspicious activity detection with configurable alert thresholds
- Comprehensive security testing suite for continuous monitoring
- See [Security Implementation Guide](/docs/security-implementation-guide.md) for details

### 2. Payment and Receipt System
- Automated receipt generation for all platform transactions
- Comprehensive receipt management interface for users
- PDF export functionality for documentation purposes
- Secure storage and access controls for transaction history
- See [Payment Receipt System Guide](/docs/payment-receipt-system-guide.md) for details

### 3. Analytics Dashboard with Enhanced Export
- Comprehensive analytics dashboard for platform metrics
- High-performance data export in multiple formats (CSV, JSON, PDF, Excel)
- Optimized processing for large datasets
- Interactive visualizations for transaction data, user growth, and revenue
- Transaction volume and user growth metrics
- Financial performance indicators
- System health monitoring
- Customizable date ranges for detailed analysis
- See [Analytics Export Feature](/docs/analytics-export-feature.md) for details
- See [Analytics Reporting Guide](/docs/analytics-reporting-guide.md) for technical details

### 4. Enhanced Dispute Resolution
- Structured workflow for handling trade disputes
- Evidence submission and document management
- Timeline view for dispute progression tracking
- Arbitration process for complex cases
- Real-time notifications for dispute updates
- See [Dispute Resolution Guide](/docs/dispute-resolution-guide.md) for details

### 5. Authentication System
- Multi-factor authentication for enhanced security
- Email verification and password recovery
- User role-based access control (see [RBAC Documentation](/docs/role-based-access-control.md))
  - Custom Firebase claims for secure role management
  - Support for Admin, Support, and User roles with appropriate access controls
  - Role-protected routes and components with granular permissions
  - View-only support role with admin panel access but limited functionality
- JWT token-based authentication flow
- Comprehensive server and client-side role validation

### 2. P2P Trading System
- Create and manage invest/borrow tickets
- Automatic matching of lenders and borrowers
- Escrow system for transaction security
- Interest rate calculation based on transaction type
- Ticket status tracking (Open, Escrow, Completed, Disputed, Cancelled)
- Detailed ticket view with full transaction information
- Filter and sort functionality for trade tickets
- Transaction history tracking for all trading activities
- Risk assessment for transaction matching

---

## Business Model & How It Works

### Step 1: Choose & Buy a Membership Package
- Users select a membership plan and deposit funds to activate their account.
- This deposit acts as a security fee, allowing users to trade.
- Users are charged 10% of their security fund as an administration fee.

### Step 2: Start Trading
- Users log into their dashboard to invest and borrow coins.
- If the desired amount isn’t available, they can create a Borrow or Invest ticket.
- The system matches investors and lenders for seamless peer-to-peer transactions.

---

## Membership Packages

| Plan        | Security Fee | Refundable | Loan Limit | Investment Limit | Commission | Txn Fee | Admin Fee |
|-------------|-------------|------------|------------|------------------|------------|---------|-----------|
| Basic       | R550        | R500       | R500       | R5,000           | 1%         | R10     | R50       |
| Ambassador  | R1,100      | R1,000     | R1,000     | R10,000          | 2%         | R10     | R100      |
| VIP         | R5,500      | R5,000     | R5,000     | R50,000          | 3%         | R10     | R500      |
| Business    | R11,000     | R10,000    | R10,000    | R100,000         | 5%         | R10     | R1,000    |

- Loan up to your tier limit, with a 25% repayment fee (5% to borrower's wallet, rest to investor).
- Invest up to your tier limit and earn 20% interest per month (5% to investor's wallet, rest to bank account).
- Earn tiered commission on referrals.
- R10 transaction fee applies to user-initiated transactions.

---

## Key Features

### Loan System
- Borrow funds based on membership tier.
- 25% repayment fee on loans; 5% of repaid money goes to borrower's wallet.
- Instant loan approval based on account history and activity.

### Lending System
- List coins for lending or investment.
- Create lending/investment tickets if no suitable offer is found.
- Automated matching system for secure transactions.

### Referral & Commission System
- Earn up to 5% commission on all referrals.
- Tiered commission structure and bonuses for top referrers.

### Transaction Security & Compliance
- Escrow system: Funds held until both parties confirm.
- KYC (Know Your Customer) verification.
- Regulatory compliance (FSCA & SARB guidelines).

### Customer Support & Dispute Resolution
- 24/7 support team.
- Clear dispute resolution process.

### Technology & Innovation
- AI-powered fraud detection and risk assessment.
- Mobile-friendly dashboard.
- Future: Mobile app, cross-border transactions, fiat-to-coin, blockchain integration.

## Authentication & Security System

### Multi-Factor Authentication (MFA)
- SMS-based two-factor authentication
- Enhanced account security for sensitive operations
- Optional but highly recommended for all accounts

### Rate Limiting
- Protection against brute force attacks
- IP-based and account-based rate limiting
- Customizable thresholds for different operations

### Comprehensive Logging
- Detailed audit trails of all authentication events
- Real-time security monitoring
- Exportable logs for compliance purposes

### Admin Authentication Management
- User account control and monitoring
- Security event monitoring dashboard
- Authentication logs review and analysis

### Testing Tools
- Integrated testing utilities for developers
- End-to-end testing support
- Security testing harness

### Technical Notes
- Firebase Admin v11.11.1 is used for compatibility with Langchain
- Authentication system works in both client and server environments
- Real-time monitoring via WebSocket on adjustable ports

For detailed documentation, see:
- [Administrator Authentication Guide](./docs/admin-authentication-guide.md)
- [User MFA Guide](./docs/user-mfa-guide.md)
- [Authentication System Fixes](./docs/authentication-system-fixes.md)

### Revenue Model
- Transaction Fees: R10 per transaction.
- Membership Fees: One-time security deposit.

---

## Roadmap & Future Enhancements
- Cross-border transactions.
- Fiat-to-coin conversions.
- Blockchain integration for transparency and security.
- Enhanced admin dashboard for compliance and support.
- Automated commission payouts and referral leaderboard.
- Advanced risk assessment and loan scoring.

---

## Compliance & Security
- Escrow, KYC, and audit logging.
- Automated and manual fraud detection.
- Data privacy and regulatory compliance.

---

## Style & UX Guidelines
- Clean, card-based layouts.
- Brand Colors: #193281, #5e17eb and #cb6ce6, black and white.
- Simple, outlined icons for actions and categories.
- Mobile-first but fully responsive and accessible design.
