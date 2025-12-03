'use client';

import TestReferralNotifications from '@/tests/referral-notifier-test';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function TestPage() {
  return (
    <ProtectedRoute>
      <TestReferralNotifications />
    </ProtectedRoute>
  );
}
