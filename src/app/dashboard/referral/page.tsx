'use client';

import ReferralDashboard from '@/components/referral/ReferralDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ReferralPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6">
        <ReferralDashboard />
      </div>
    </ProtectedRoute>
  );
}

