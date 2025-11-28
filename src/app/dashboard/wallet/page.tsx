'use client';

export const dynamic = 'force-dynamic';

import WalletManagement from "@/components/WalletManagement";

export default function WalletPage() {
  return (
    <div className="wallet">
      <h1 className="text-2xl font-bold mb-4">Wallet Management</h1>
      <WalletManagement />
    </div>
  );
}

