'use client';

import ReceiptManager from "@/components/payments/ReceiptManager";
import { useAuth } from "@/components/AuthProvider";
import { Receipt } from "lucide-react";
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ReceiptsPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Payment Receipts</h1>
        <ReceiptManager />
      </div>
    </ProtectedRoute>
  );
}
