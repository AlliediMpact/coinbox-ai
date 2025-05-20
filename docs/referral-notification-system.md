# CoinBox Connect Referral Notification System

This document explains the architecture and usage of the referral notification system for the CoinBox Connect platform.

## Overview

The referral notification system provides real-time notifications to users about their referral activities, including:
- New referral sign-ups
- Commission earnings
- Referral tier upgrades

The system uses Firebase Firestore for real-time updates and integrates with the overall notification UI in the CoinBox Connect dashboard.

## Components

### 1. ReferralNotifier Component

Located at `src/components/referral/ReferralNotifier.tsx`

This component displays:
- Notification bell icon with unread count badge
- Dropdown menu showing the latest notifications
- Options to view all notifications or mark as read

### 2. useReferralNotifications Hook

Located at `src/hooks/use-referral-notifications.ts`

This custom hook:
- Subscribes to real-time updates from Firebase
- Filters notifications by user and type
- Tracks unread notification counts
- Limits the number of notifications displayed

## Database Structure

Notifications are stored in the `notifications` collection in Firebase Firestore with the following schema:

```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'referral' | 'commission';
  message: string;
  createdAt: Timestamp;
  read: boolean;
  data?: {
    amount?: number;
    referralEmail?: string;
    // Additional metadata as needed
  }
}
```

## Usage

### Adding to a Page/Component

Import and use the ReferralNotifier component:

```tsx
import { ReferralNotifier } from '@/components/referral/ReferralNotifier';

// Then in your component:
<ReferralNotifier />
```

### Creating a New Notification

To create a new notification programmatically:

```typescript
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Create a new referral notification
await addDoc(collection(db, 'notifications'), {
  userId: user.uid,
  type: 'referral',  // 'referral' or 'commission'
  message: 'New referral: user@example.com',
  createdAt: serverTimestamp(),
  read: false,
  data: {
    referralEmail: 'user@example.com'
  }
});
```

## Testing

A test page is available at `/dashboard/test-notifications` that allows you to:
- Create test notifications of different types
- Preview how notifications appear in the UI
- Verify real-time updates

## Performance Optimization

For optimal performance:
- Create appropriate Firebase indexes (see `src/lib/notification-optimization.js`)
- Limit the number of notifications fetched
- Implement notification cleanup for older notifications

## References

- Firebase Documentation: https://firebase.google.com/docs/firestore/query-data/listen
- Date-fns Documentation: https://date-fns.org/docs/format
