'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useState, useEffect} from "react";
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast"; // Import the useToast hook
import { useAuth } from '@/components/AuthProvider';
import { getFirestore, doc, onSnapshot, updateDoc, collection, query, orderBy, limit, startAfter, getDocs, addDoc } from 'firebase/firestore';
import { formatCurrency } from '@/lib/utils';
import { useFormWithValidation } from '@/lib/form-utils';
import { ErrorBoundary } from './ErrorBoundary';
import { z } from 'zod';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  description?: string;
}

interface WalletData {
  balance: number;
  lockedBalance: number;
  lastUpdated: string;
}

const walletFormSchema = z.object({
  amount: z.number().positive(),
  method: z.string()
});

const depositFormSchema = z.object({
  amount: z.number().positive(),
  method: z.string()
});

const downloadCSV = (data: any[], filename: string) => {
  const csvContent = [
    // Headers
    Object.keys(data[0]).join(','),
    // Data rows
    ...data.map(item => Object.values(item).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function WalletManagement() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [depositMethod, setDepositMethod] = useState("Stripe");
  const [depositAmount, setDepositAmount] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallet, setWallet] = useState<WalletData>({ balance: 0, lockedBalance: 0, lastUpdated: '' });
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const db = getFirestore();
  const ITEMS_PER_PAGE = 10;

  const { form: depositForm, handleSubmit: handleDepositSubmit, loading: depositLoading } = useFormWithValidation(
    depositFormSchema,
    async (values) => {
      if (!user) throw new Error("Not authenticated");
      
      const walletRef = doc(db, "wallets", user.uid);
      const transactionRef = collection(walletRef, "transactions");
      const pendingTransaction = await addDoc(transactionRef, {
        type: "Deposit",
        amount: values.amount,
        date: new Date().toISOString(),
        method: values.method,
        status: 'pending'
      });

      const { paystackService } = await import("@/lib/paystack-service");
      const response = await paystackService.initializePayment(user.email, values.amount);
      setOpen(false);
    },
    { successMessage: "Deposit initiated successfully" }
  );

  // Subscribe to real-time wallet updates
  useEffect(() => {
    if (!user) return;

    const walletRef = doc(db, "wallets", user.uid);
    const unsubscribe = onSnapshot(walletRef, (doc) => {
      if (doc.exists()) {
        setWallet({
          balance: doc.data().balance || 0,
          lockedBalance: doc.data().lockedBalance || 0,
          lastUpdated: new Date().toISOString()
        });
      }
    });

    return () => unsubscribe();
  }, [user, db]);

  // Load initial transactions with pagination
  useEffect(() => {
    if (!user) return;
    loadTransactions();
  }, [user, loadTransactions]);

  const loadTransactions = async (loadMore = false) => {
    try {
      const transactionsRef = collection(db, "wallets", user.uid, "transactions");
      let transactionQuery = query(
        transactionsRef,
        orderBy("date", "desc"),
        limit(ITEMS_PER_PAGE)
      );

      if (loadMore && lastDoc) {
        transactionQuery = query(
          transactionsRef,
          orderBy("date", "desc"),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(transactionQuery);
      const newTransactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction));

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);

      if (loadMore) {
        setTransactions(prev => [...prev, ...newTransactions]);
      } else {
        setTransactions(newTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (data: { amount: number; method: string }) => {
    const { amount, method } = data;

    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Create a pending transaction in Firestore
      const walletRef = doc(db, "wallets", user.uid);
      const transactionRef = collection(walletRef, "transactions");
      const pendingTransaction = await addDoc(transactionRef, {
        type: "Deposit",
        amount: amount,
        date: new Date().toISOString(),
        method: method,
        status: 'pending',
        description: 'Awaiting Paystack payment',
      });

      // 2. Call Paystack to initialize payment
      // Dynamically import paystackService to avoid SSR issues
      const { paystackService } = await import("@/lib/paystack-service");
      const paystackResponse = await paystackService.initializePayment(
        user.email,
        amount,
        {
          fullName: user.displayName || '',
          phone: user.phoneNumber || '',
          metadata: {
            transactionId: pendingTransaction.id,
            userId: user.uid,
            depositMethod: method,
          },
        }
      );

      // 3. Store transaction reference for callback verification
      localStorage.setItem('pending_wallet_deposit', JSON.stringify({
        transactionId: pendingTransaction.id,
        amount,
        userId: user.uid,
        reference: paystackResponse.data.reference,
      }));

      // 4. Redirect to Paystack payment page
      window.location.href = paystackResponse.data.authorization_url;
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate deposit",
        variant: "destructive",
      });
    }
  };

  const handleWithdrawal = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      });
      return;
    }

    if (amount > wallet.balance) {
      toast({
        title: "Error",
        description: "Insufficient balance.",
        variant: "destructive",
      });
      return;
    }

    try {
      const walletRef = doc(db, "wallets", user.uid);
      const transactionRef = collection(walletRef, "transactions");

      await updateDoc(walletRef, {
        balance: wallet.balance - amount,
        lastUpdated: new Date().toISOString()
      });

      await addDoc(transactionRef, {
        type: "Withdrawal",
        amount: -amount,
        date: new Date().toISOString(),
        method: depositMethod,
        status: 'completed'
      });

      toast({
        title: "Withdrawal Successful",
        description: `Successfully withdrew ${formatCurrency(amount)} via ${depositMethod}.`,
      });
      setDepositAmount("");
      setOpen(false);
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Error",
        description: "Failed to process withdrawal",
        variant: "destructive",
      });
    }
  };

  const getExportData = () => {
    return transactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString(),
      Type: t.type,
      Amount: formatCurrency(t.amount),
      Method: t.method,
      Status: t.status,
      Description: t.description || ''
    }));
  };

  const { form, handleSubmit, loading: formLoading } = useFormWithValidation(
    walletFormSchema,
    handleTransaction,
    { successMessage: "Transaction processed successfully" }
  );

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Wallet Management</CardTitle>
            <CardDescription>View your wallet balance and transaction history.</CardDescription>
          </div>
          <Button 
            onClick={() => downloadCSV(getExportData(), `transactions-${new Date().toISOString()}.csv`)}
            className="inline-flex items-center justify-center"
          >
            Export Statement
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <div>
                <strong>Available Balance:</strong>
                <p className="text-2xl font-bold">{formatCurrency(wallet.balance)}</p>
              </div>
              <div>
                <strong>Locked Balance:</strong>
                <p className="text-2xl font-bold text-gray-500">{formatCurrency(wallet.lockedBalance)}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Last updated: {new Date(wallet.lastUpdated).toLocaleString()}
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <strong>Transaction History</strong>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>Deposit / Withdraw</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Deposit / Withdraw Funds</DialogTitle>
                    <DialogDescription>Select a payment method and enter the deposit amount.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={depositForm.handleSubmit(handleDepositSubmit)}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label htmlFor="depositMethod">Payment Method</label>
                        <Select onValueChange={(value) => setDepositMethod(value)}>
                          <SelectTrigger id="depositMethod">
                            <SelectValue placeholder={depositMethod} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Stripe">Stripe</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Crypto">Crypto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="depositAmount">Amount</label>
                        <Input
                          type="number"
                          id="depositAmount"
                          placeholder="Enter amount"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <DialogClose asChild>
                        <Button type="button" variant="secondary">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type="submit" disabled={depositLoading}>
                        {depositLoading ? 'Processing...' : 'Submit'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    transaction.status === 'completed'
                      ? 'bg-green-50'
                      : transaction.status === 'pending'
                      ? 'bg-yellow-50'
                      : 'bg-red-50'
                  }`}
                >
                  <div>
                    <p className="font-medium">{transaction.type}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()} via {transaction.method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className={`text-sm ${
                      transaction.status === 'completed'
                        ? 'text-green-600'
                        : transaction.status === 'pending'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}

              {hasMore && !loading && (
                <Button
                  onClick={() => loadTransactions(true)}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Load More
                </Button>
              )}

              {loading && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}

