'use client';

import CommissionTrackingDashboard from "@/components/CommissionTrackingDashboard";
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function CommissionPage() {
  return (
    <ProtectedRoute>
      <div className="commission-page max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Commission Dashboard</h1>
          <p className="text-gray-600">Track your referral commissions, earnings, and leaderboard position</p>
        </div>
        <CommissionTrackingDashboard />
      </div>
    </ProtectedRoute>
  );
}

