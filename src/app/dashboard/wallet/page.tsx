'use client';

export const dynamic = 'force-dynamic';

import WalletManagement from "@/components/WalletManagement";
import BankAccountVerification from "@/components/BankAccountVerification";
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function WalletPage() {
  return (
    <ProtectedRoute>
      <div className="wallet space-y-6">
        <h1 className="text-2xl font-bold">Wallet Management</h1>
        
        {/* Bank Account Verification Section */}
        <BankAccountVerification />
        
        {/* Wallet Management Section */}
        <WalletManagement />
      </div>
    </ProtectedRoute>
  );
}

