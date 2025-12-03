'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Coins, Wallet, Shield } from 'lucide-react';

const transactions = [
  { id: 1, type: "Deposit", amount: "R1000", date: "2024-07-15", status: "Completed" },
  { id: 2, type: "Withdrawal", amount: "R200", date: "2024-07-14", status: "Completed" },
  { id: 3, type: "Loan", amount: "R300", date: "2024-07-12", status: "Pending" },
];

export default function TransactionsPage() {
  return (
    <ProtectedRoute>
      <div className="p-6">
        <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {transaction.type === 'Deposit' && <Coins className="h-8 w-8 text-green-500" />}
                  {transaction.type === 'Withdrawal' && <Wallet className="h-8 w-8 text-red-500" />}
                  {transaction.type === 'Loan' && <Shield className="h-8 w-8 text-blue-500" />}
                  <div>
                    <p className="font-medium">{transaction.type}</p>
                    <p className="text-sm text-gray-500">{transaction.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{transaction.amount}</p>
                  <p className="text-sm text-gray-500">{transaction.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    </ProtectedRoute>
  );
}
