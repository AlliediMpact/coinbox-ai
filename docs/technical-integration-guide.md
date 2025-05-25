# CoinBox AI Technical Integration Guide

## Introduction
This technical guide explains how to integrate with and extend the newly implemented features in the CoinBox AI platform. It's intended for developers who need to work with the payment receipt system, dispute resolution, or analytics dashboard.

## Payment Receipt System

### Technical Architecture
The receipt system follows a layered architecture:
```
UI Layer: ReceiptManager, ReceiptViewer
Service Layer: receipt-service.ts
Data Layer: Firestore 'receipts' collection
```

### Integration Points
To integrate with the receipt system in your code:

```typescript
import { receiptService } from '@/lib/receipt-service';

// To generate a receipt
const receipt = await receiptService.generateReceipt({
  paymentId: 'payment-123',
  userId: 'user-456',
  amount: 1000,
  currency: 'ZAR',
  description: 'Subscription payment',
  items: [
    {
      description: 'Monthly Premium Plan',
      quantity: 1,
      unitPrice: 1000,
      totalPrice: 1000
    }
  ],
  metadata: {
    subscriptionId: 'sub-789'
  }
});

// To get receipts for a user
const userReceipts = await receiptService.getUserReceipts('user-456');

// To download receipt as PDF
const pdfUrl = await receiptService.generatePDF('receipt-123');
```

### Event Hooks
The receipt system emits events at various stages:
- `receipt.generated`: When a new receipt is created
- `receipt.viewed`: When a user views a receipt
- `receipt.downloaded`: When a receipt is downloaded as PDF

## Dispute Resolution System

### Technical Architecture
```
UI Layer: EnhancedDisputeManagement
Service Layer: dispute-resolution-service.ts
Data Layer: Firestore 'disputes' collection
```

### Status Workflow
Disputes follow a defined workflow:
1. `Open`: Initial state
2. `Evidence`: Evidence gathering phase
3. `UnderReview`: Admin review phase
4. `Arbitration`: External arbitration (if needed)
5. `Resolved`: Final state with decision
6. `Closed`: Administrative closure

### Integration Points
To integrate with the dispute system:

```typescript
import { disputeResolutionService } from '@/lib/dispute-resolution-service';

// Create a new dispute
const dispute = await disputeResolutionService.createDispute({
  tradeId: 'trade-123',
  userId: 'user-456',
  reason: 'Payment not received',
  description: 'I completed the transaction but haven't received payment'
});

// Add evidence to a dispute
await disputeResolutionService.addEvidence('dispute-123', {
  type: 'document',
  title: 'Transaction Receipt',
  description: 'Proof of transaction',
  url: 'https://example.com/evidence-1.pdf',
  submittedBy: 'user-456'
});

// Get disputes for a user
const userDisputes = await disputeResolutionService.getUserDisputes('user-456');
```

## Analytics Dashboard

### Technical Architecture
```
UI Layer: AnalyticsDashboard
Service Layer: analytics-service.ts
Data Layer: Firestore 'analytics' collections
```

### Data Aggregation
Analytics data is aggregated at different intervals:
- Real-time: Live transaction and error data
- Hourly: Short-term trends and patterns
- Daily: User growth and volume metrics
- Monthly: Financial performance and KPIs

### Integration Points
To integrate with the analytics system:

```typescript
import { analyticsService } from '@/lib/analytics-service';

// Record a transaction for analytics
await analyticsService.trackTransaction({
  amount: 1000,
  currency: 'ZAR',
  type: 'deposit',
  userId: 'user-456',
  metadata: {
    source: 'bank_transfer'
  }
});

// Get transaction analytics
const transactionData = await analyticsService.getTransactionAnalytics({
  startDate: new Date('2025-04-24'),
  endDate: new Date('2025-05-24'),
  interval: 'daily'
});

// Get user growth metrics
const userGrowth = await analyticsService.getUserGrowthMetrics({
  period: 'last_30_days'
});
```

## E2E Testing Integration

### Test Structure
The e2e tests follow this structure:
```
test.describe('Feature Test', () => {
  // Setup before all tests
  test.beforeAll(async () => { ... });

  // Cleanup after all tests
  test.afterAll(async () => { ... });

  // Individual test case
  test('should perform expected action', async ({ page }) => {
    // Test implementation
  });
});
```

### Using Test Helpers
To use the test helpers:

```typescript
import { createMockUser, loginAsMockUser } from '../test-helpers/auth-helpers';
import { generateMockPayment } from '../test-helpers/payment-helpers';
import { waitForNotification } from '../test-helpers/notification-helpers';

// Create test user
const userId = await createMockUser({
  displayName: 'Test User',
  email: 'test@example.com',
  password: 'Password123'
});

// Login as user
await loginAsMockUser(page, 'test@example.com', 'Password123');

// Generate mock payment data
const paymentData = generateMockPayment();

// Wait for notification to appear
await waitForNotification(page);
```

## Best Practices

### Error Handling
Always handle errors in service integrations:
```typescript
try {
  await receiptService.generateReceipt({ ... });
} catch (error) {
  console.error('Failed to generate receipt:', error);
  // Handle error appropriately
}
```

### Permission Checking
Always verify user permissions before accessing sensitive functions:
```typescript
import { hasAdminAccess } from '@/lib/auth-utils';

const hasAccess = await hasAdminAccess(userId);
if (!hasAccess) {
  throw new Error('Unauthorized access');
}
```

### Event Handling
Listen for system events to update UI in real-time:
```typescript
useEffect(() => {
  const unsubscribe = notificationService.onNotification(
    user.uid,
    (notification) => {
      // Update UI based on notification
    }
  );
  return () => unsubscribe();
}, [user]);
```
