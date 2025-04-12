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

const initialTransactionHistory = [
  {id: 1, type: "Deposit", amount: "R1000", date: "2024-07-14", method: "Stripe"},
  {id: 2, type: "Withdrawal", amount: "R200", date: "2024-07-13", method: "Bank Transfer"},
  {id: 3, type: "Loan", amount: "R300", date: "2024-07-12", method: "Coin Transfer"},
];

export default function WalletManagement() {
  const [open, setOpen] = useState(false);
  const [depositMethod, setDepositMethod] = useState("Stripe");
  const [depositAmount, setDepositAmount] = useState("");
  const [transactionHistory, setTransactionHistory] = useState(initialTransactionHistory);
  const [walletBalance, setWalletBalance] = useState(1800); // Initial wallet balance
  const { toast } = useToast();

    // Load wallet balance from local storage on component mount
    useEffect(() => {
        const storedBalance = localStorage.getItem('walletBalance');
        if (storedBalance) {
            setWalletBalance(parseFloat(storedBalance));
        }
    }, []);

    // Save wallet balance to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('walletBalance', walletBalance.toString());
    }, [walletBalance]);


    const handleDeposit = () => {
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({
                title: "Error",
                description: "Please enter a valid deposit amount.",
                variant: "destructive",
            });
            return;
        }

        // Simulate successful deposit
        const newBalance = walletBalance + amount;
        setWalletBalance(newBalance);
        setTransactionHistory([
            ...transactionHistory,
            {
                id: transactionHistory.length + 1,
                type: "Deposit",
                amount: `R${amount}`,
                date: new Date().toLocaleDateString(),
                method: depositMethod,
            },
        ]);

        toast({
            title: "Deposit Successful",
            description: `Successfully deposited R${amount} via ${depositMethod}.`,
        });
        setDepositAmount("");
        setOpen(false);
    };


    const handleWithdrawal = () => {
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({
                title: "Error",
                description: "Please enter a valid withdrawal amount.",
                variant: "destructive",
            });
            return;
        }

        if (amount > walletBalance) {
            toast({
                title: "Error",
                description: "Insufficient balance.",
                variant: "destructive",
            });
            return;
        }

        // Simulate successful withdrawal
        const newBalance = walletBalance - amount;
        setWalletBalance(newBalance);
        setTransactionHistory([
            ...transactionHistory,
            {
                id: transactionHistory.length + 1,
                type: "Withdrawal",
                amount: `R${amount}`,
                date: new Date().toLocaleDateString(),
                method: depositMethod,
            },
        ]);

        toast({
            title: "Withdrawal Initiated",
            description: `Successfully initiated withdrawal of R${amount} via ${depositMethod}.`,
        });
        setDepositAmount("");
        setOpen(false);
    };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Management</CardTitle>
        <CardDescription>View your wallet balance and transaction history.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <strong>Wallet Balance:</strong> R{walletBalance}
        </div>
        <div>
          <strong>Transaction History:</strong>
          <ul>
            {transactionHistory.map((transaction) => (
              <li key={transaction.id} className="flex justify-between items-center">
                <span>
                  {transaction.type} - {transaction.amount}
                </span>
                <span>{transaction.date} - {transaction.method}</span>
              </li>
            ))}
          </ul>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Deposit / Withdraw Funds</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deposit / Withdraw Funds</DialogTitle>
              <DialogDescription>Select a payment method and enter the deposit amount.</DialogDescription>
            </DialogHeader>
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
                <Button type="button" onClick={handleDeposit} className="bg-green-500 text-white hover:bg-green-700">
                    Deposit
                </Button>
                <Button type="button" onClick={handleWithdrawal} className="bg-red-500 text-white hover:bg-red-700">
                    Withdraw
                </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

