'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Home as HomeIcon, ReferralCode, Share2, Shield, Users, Wallet } from 'lucide-react';
import RiskAssessmentTool from "@/components/RiskAssessmentTool";

const recentTransactions = [
  { id: 1, type: "Deposit", amount: "R1000", date: "2024-07-15" },
  { id: 2, type: "Withdrawal", amount: "R200", date: "2024-07-14" },
  { id: 3, type: "Loan", amount: "R300", date: "2024-07-12" },
];

export default function Dashboard() {
  const { user, signOutUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  if (!user) {
    return <div>Redirecting to Authentication...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Welcome, {user.email}!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Balance</CardTitle>
            <CardDescription>Your current coin holdings</CardDescription>
          </CardHeader>
          <CardContent>
            <div>Total Balance: R1,800</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access key features quickly</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={() => router.push('/dashboard/trading')}>Invest</Button>
            <Button onClick={() => router.push('/dashboard/trading')}>Borrow</Button>
            <Button onClick={() => router.push('/dashboard/wallet')}>Transactions</Button>
            <Button onClick={() => router.push('/dashboard/referral')}>
                Refer a Friend
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ul>
              {recentTransactions.map((transaction) => (
                <li key={transaction.id} className="py-2">
                  {transaction.type} - {transaction.amount} - {transaction.date}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>AI-driven risk assessment based on transaction history.</CardDescription>
          </CardHeader>
          <CardContent>
            <RiskAssessmentTool userId={user.uid} />
          </CardContent>
        </Card>
      </div>

      <button onClick={() => signOutUser()} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">
        Sign Out
      </button>
    </div>
  );
}
