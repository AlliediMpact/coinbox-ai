'use client';

import EnhancedKycVerification from "@/components/EnhancedKycVerification";
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function KycPage() {
  return (
    <ProtectedRoute>
      <div className="kyc-page max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification</h1>
          <p className="text-gray-600">Complete your Know Your Customer verification to unlock all platform features</p>
        </div>
        <EnhancedKycVerification />
      </div>
    </ProtectedRoute>
  );
}


