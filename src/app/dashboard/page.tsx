export const dynamic = 'force-dynamic';
'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, CreditCard, Home as HomeIcon, ReferralCode, Share2, Shield, Users, Wallet, BarChart3 } from 'lucide-react';
import RiskAssessmentTool from "@/components/RiskAssessmentTool";
import SummaryComponent from "@/components/SummaryComponent";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
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
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false); // Use state to track mounting
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [commissionBalance, setCommissionBalance] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true); // Set to true after the component mounts
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

    // Fetch user-specific data (replace with your actual data fetching logic)
    useEffect(() => {
        if (user) {
            // Simulate fetching wallet balance and commission balance from a database
            const fetchBalances = async () => {
                // Replace these with actual database calls using Firebase or your preferred backend
                const wallet = await getWalletBalance(user.uid);
                const commission = await getCommissionBalance(user.uid);

                setWalletBalance(wallet);
                setCommissionBalance(commission);
            };
            fetchBalances();
        }
    }, [user]);

  if (!user || !isMounted) {
    return <div>Redirecting to Authentication...</div>;
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 300
      }
    },
    hover: { 
      y: -5, 
      scale: 1.02,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    }
  };

  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-screen p-4 dashboard"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h1 
        className="text-3xl font-bold mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Dashboard
      </motion.h1>
      
      <motion.p 
        className="text-lg mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Welcome, {user.email}!
      </motion.p>

      {/* PWA Install Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-4xl mb-6"
      >
        <PWAInstallPrompt />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">

        {/* Wallet Balance Card */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          transition={{ duration: 0.3 }}
        >
          <Card className="h-full border-l-4 border-primary-blue">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Wallet className="mr-2 h-5 w-5 text-primary-blue" />
                Wallet Balance
              </CardTitle>
              <CardDescription className="text-gray-500">Your current coin holdings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent">
                  Total Balance: {walletBalance !== null ? `R${walletBalance}` : "Loading..."}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions Card */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          transition={{ duration: 0.3 }}
        >
          <Card className="h-full border-l-4 border-accent">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Coins className="mr-2 h-5 w-5 text-accent" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-gray-500">Access key features quickly</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => router.push('/dashboard/trading')} className="bg-gradient-to-r from-primary-blue to-primary-purple">
                        <Coins className="mr-2 h-4 w-4" />
                        Invest
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Invest coins
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => router.push('/dashboard/trading')} variant="outline">
                        <Wallet className="mr-2 h-4 w-4" />
                        Borrow
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Borrow Coins
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => router.push('/dashboard/wallet')} variant="secondary">
                      <Share2 className="mr-2 h-4 w-4" />
                      Transactions
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  Manage Transactions
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => router.push('/dashboard/referral')} variant="secondary">
                      <Users className="mr-2 h-4 w-4" />
                      Refer a Friend
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  Invite Friends
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
        </motion.div>

        {/* Recent Transactions Card */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          transition={{ duration: 0.3 }}
        >
          <Card className="h-full border-l-4 border-primary-purple">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Share2 className="mr-2 h-5 w-5 text-primary-purple" />
                Recent Transactions
              </CardTitle>
              <CardDescription className="text-gray-500">Your latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recentTransactions.map((transaction) => (
                  <motion.li 
                    key={transaction.id} 
                    className="py-2 px-3 rounded-md border border-neutral-light flex justify-between items-center"
                    whileHover={{ backgroundColor: 'rgba(94, 23, 235, 0.05)' }}
                  >
                    <div className="flex items-center">
                      {transaction.type === 'Deposit' && <Coins className="mr-2 h-4 w-4 text-green-500" />}
                      {transaction.type === 'Withdrawal' && <Wallet className="mr-2 h-4 w-4 text-red-500" />}
                      {transaction.type === 'Loan' && <Shield className="mr-2 h-4 w-4 text-blue-500" />}
                      <span>{transaction.type}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-semibold">{transaction.amount}</span>
                      <span className="text-xs text-neutral-medium">{transaction.date}</span>
                    </div>
                  </motion.li>
                ))}
              </ul>
              <motion.div 
                className="mt-4 text-center"
                whileHover={{ scale: 1.05 }}
              >
                <Button 
                  variant="link" 
                  onClick={() => router.push('/dashboard/wallet')}
                  className="text-primary-blue"
                >
                  View All Transactions
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk Assessment Card */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          transition={{ duration: 0.3 }}
        >
          <Card className="h-full border-l-4 border-primary-blue">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Shield className="mr-2 h-5 w-5 text-primary-blue" />
                Risk Assessment
              </CardTitle>
              <CardDescription className="text-gray-500">AI-driven risk assessment based on transaction history.</CardDescription>
            </CardHeader>
            <CardContent>
              <RiskAssessmentTool userId={user.uid} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Text Summarization Card */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          transition={{ duration: 0.3 }}
        >
          <Card className="h-full border-l-4 border-primary-purple">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary-purple" />
                Text Summarization
              </CardTitle>
              <CardDescription className="text-gray-500">Summarize any text using AI.</CardDescription>
            </CardHeader>
            <CardContent>
              <SummaryComponent />
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Cards - Link to New Features */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          transition={{ duration: 0.3 }}
        >
          <Card className="h-full border-l-4 border-accent">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Shield className="mr-2 h-5 w-5 text-accent" />
                Enhanced Features
              </CardTitle>
              <CardDescription className="text-gray-500">Explore more options</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
             <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => router.push('/dashboard/kyc')} variant="outline" className="border-primary-purple text-primary-purple">
                        <Shield className="mr-2 h-4 w-4" />
                        KYC Verification
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Verify your identity
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => router.push('/dashboard/support')} variant="outline" className="border-primary-blue text-primary-blue">
                        <Users className="mr-2 h-4 w-4" />
                        Contact Support
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Need some assistance?
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => router.push('/dashboard/commissions')} variant="outline" className="border-accent text-accent">
                        <Coins className="mr-2 h-4 w-4" />
                        View Commissions
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    See who you have referred
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => router.push('/dashboard/analytics')} variant="outline" className="border-blue-500 text-blue-500">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analytics
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    View trading analytics and insights
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => router.push('/dashboard/payments')} variant="outline" className="border-green-500 text-green-500">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Payments & Billing
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Manage payments and receipts
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

          </CardContent>
        </Card>
        </motion.div>

      </div>

      <button onClick={() => logout()} className="mt-8 px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-300">
        Sign Out
      </button>
    </motion.div>
  );
}

// Simulated function to fetch wallet balance from a database
async function getWalletBalance(userId: string): Promise<number> {
    // Replace with your actual database call using Firebase or your preferred backend
    // This is just a placeholder to simulate fetching data
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(Math.floor(Math.random() * 2000)); // Simulating a balance
        }, 500);
    });
}

// Simulated function to fetch commission balance from a database
async function getCommissionBalance(userId: string): Promise<number> {
    // Replace with your actual database call using Firebase or your preferred backend
    // This is just a placeholder to simulate fetching data
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(Math.floor(Math.random() * 500)); // Simulating a balance
        }, 500);
    });
}
