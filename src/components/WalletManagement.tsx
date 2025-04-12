'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const transactionHistory = [
  {id: 1, type: "Deposit", amount: "R1000", date: "2024-07-14", method: "Stripe"},
  {id: 2, type: "Withdrawal", amount: "R200", date: "2024-07-13", method: "Bank Transfer"},
  {id: 3, type: "Loan", amount: "R300", date: "2024-07-12", method: "Coin Transfer"},
];

export default function WalletManagement() {
  const [open, setOpen] = useState(false);
  const [depositMethod, setDepositMethod] = useState("Stripe");
  const [depositAmount, setDepositAmount] = useState("");

  const handleDeposit = () => {
    // Implement deposit logic, integrating with Stripe or other payment gateways
    alert(`Depositing R${depositAmount} via ${depositMethod}`);
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
                <span>{transaction.date} - {transaction.method}</span>
              </li>
            ))}
          </ul>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Deposit Funds</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deposit Funds</DialogTitle>
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
              <Button type="button" onClick={handleDeposit}>
                Deposit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
