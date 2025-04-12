'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Home as HomeIcon, ReferralCode, Share2, Shield, Users, Wallet } from 'lucide-react';
import RiskAssessmentTool from "@/components/RiskAssessmentTool";
import SummaryComponent from "@/components/SummaryComponent";
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const recentTransactions = [
  { id: 1, type: "Deposit", amount: "R1000", date: "2024-07-15" },
  { id: 2, type: "Withdrawal", amount: "R200", date: "2024-07-14" },
  { id: 3, type: "Loan", amount: "R300", date: "2024-07-12" },
];

export default function Dashboard() {
  const { user, signOutUser } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false); // Use state to track mounting

  useEffect(() => {
    setIsMounted(true); // Set to true after the component mounts
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  if (!user || !isMounted) {
    return <div>Redirecting to Authentication...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 dashboard">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-lg mb-4">Welcome, {user.email}!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">

        {/* Wallet Balance Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Wallet Balance</CardTitle>
            <CardDescription className="text-gray-500">Your current coin holdings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Total Balance: R1,800</div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
            <CardDescription className="text-gray-500">Access key features quickly</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button onClick={() => router.push('/dashboard/trading')}>Invest</Button>
                </TooltipTrigger>
                <TooltipContent>
                    Invest coins
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button onClick={() => router.push('/dashboard/trading')}>Borrow</Button>
                </TooltipTrigger>
                <TooltipContent>
                    Borrow Coins
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
           <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                     <Button onClick={() => router.push('/dashboard/wallet')}>Transactions</Button>
                </TooltipTrigger>
                <TooltipContent>
                    Manage Transactions
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                      <Button onClick={() => router.push('/dashboard/referral')}>Refer a Friend</Button>
                </TooltipTrigger>
                <TooltipContent>
                    Invite Friends
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Recent Transactions Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Recent Transactions</CardTitle>
            <CardDescription className="text-gray-500">Your latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5">
              {recentTransactions.map((transaction) => (
                <li key={transaction.id} className="py-2">
                  {transaction.type} - {transaction.amount} - {transaction.date}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Risk Assessment Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Risk Assessment</CardTitle>
            <CardDescription className="text-gray-500">AI-driven risk assessment based on transaction history.</CardDescription>
          </CardHeader>
          <CardContent>
            <RiskAssessmentTool userId={user.uid} />
          </CardContent>
        </Card>

        {/* Text Summarization Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Text Summarization</CardTitle>
            <CardDescription className="text-gray-500">Summarize any text using AI.</CardDescription>
          </CardHeader>
          <CardContent>
            <SummaryComponent />
          </CardContent>
        </Card>

        {/* Additional Cards - Link to New Features */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Enhanced Features</CardTitle>
            <CardDescription className="text-gray-500">Explore more options</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
             <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button onClick={() => router.push('/dashboard/kyc')}>KYC Verification</Button>
                     </TooltipTrigger>
                    <TooltipContent>
                      Verify your identity
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

             <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Button onClick={() => router.push('/dashboard/support')}>Contact Support</Button>
                     </TooltipTrigger>
                    <TooltipContent>
                      Need some assistance?
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => router.push('/dashboard/commissions')}>View Commissions</Button>
                     </TooltipTrigger>
                    <TooltipContent>
                      See who you have referred
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

          </CardContent>
        </Card>

      </div>

      <button onClick={() => signOutUser()} className="mt-8 px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-300">
        Sign Out
      </button>
    </div>
  );
}