'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

const transactionHistory = [
  {id: 1, type: "Deposit", amount: "R1000", date: "2024-07-14"},
  {id: 2, type: "Withdrawal", amount: "R200", date: "2024-07-13"},
  {id: 3, type: "Loan", amount: "R300", date: "2024-07-12"},
];

export default function WalletManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Management</CardTitle>
        <CardDescription>View your wallet balance and transaction history.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <strong>Wallet Balance:</strong> R1,800
        </div>
        <div>
          <strong>Transaction History:</strong>
          <ul>
            {transactionHistory.map((transaction) => (
              <li key={transaction.id} className="flex justify-between items-center">
                <span>
                  {transaction.type} - {transaction.amount}
                </span>
                <span>{transaction.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
