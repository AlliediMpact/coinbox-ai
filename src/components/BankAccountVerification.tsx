'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { bankVerificationService, SOUTH_AFRICAN_BANKS } from '@/lib/bank-verification-service';
import { CheckCircle2, XCircle, Loader2, Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function BankAccountVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [bankAccount, setBankAccount] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');

  // Load existing bank account
  useEffect(() => {
    if (user) {
      loadBankAccount();
    }
  }, [user]);

  const loadBankAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bank/verify?userId=${user?.uid}`);
      const data = await response.json();

      if (data.success && data.bankAccount) {
        setBankAccount(data.bankAccount);
        setAccountNumber(data.bankAccount.accountNumber);
        // Find bank code from bank name
        const bank = SOUTH_AFRICAN_BANKS.find(b => b.name === data.bankAccount.bankName);
        if (bank) {
          setBankCode(bank.code);
        }
      }
    } catch (error) {
      console.error('Error loading bank account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAccount = async () => {
    if (!accountNumber || !bankCode) {
      toast({
        title: 'Missing Information',
        description: 'Please enter account number and select a bank',
        variant: 'destructive',
      });
      return;
    }

    // Validate account number format
    if (!bankVerificationService.validateAccountNumber(accountNumber)) {
      toast({
        title: 'Invalid Account Number',
        description: 'Account number must be 9-11 digits',
        variant: 'destructive',
      });
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch('/api/bank/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.uid,
          accountNumber,
          bankCode,
        }),
      });

      const data = await response.json();

      if (data.success && data.verified) {
        toast({
          title: 'Bank Account Verified! ✅',
          description: `Account verified for: ${data.accountName}`,
        });

        // Reload bank account data
        await loadBankAccount();
      } else {
        toast({
          title: 'Verification Failed',
          description: data.message || 'Could not verify bank account. Please check your details.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred during verification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Bank Account Verification
            </CardTitle>
            <CardDescription>
              Verify your bank account to enable withdrawals
            </CardDescription>
          </div>
          {bankAccount?.verified && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {bankAccount?.verified ? (
          // Display verified bank account
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-semibold">Your verified bank account:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Bank:</span>
                    <p className="font-medium">{bankAccount.bankName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account Number:</span>
                    <p className="font-medium">{bankAccount.accountNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Account Name:</span>
                    <p className="font-medium">{bankAccount.accountName}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Verified on {new Date(bankAccount.verifiedAt?.toDate()).toLocaleDateString()}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          // Verification form
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To protect your account and enable withdrawals, you must verify your bank account.
                We use Paystack's secure verification to confirm account ownership.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bank">Select Your Bank</Label>
                <Select value={bankCode} onValueChange={setBankCode}>
                  <SelectTrigger id="bank">
                    <SelectValue placeholder="Choose your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOUTH_AFRICAN_BANKS.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="Enter your account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  maxLength={11}
                  disabled={verifying}
                />
                <p className="text-xs text-muted-foreground">
                  Must be 9-11 digits
                </p>
              </div>

              <Button
                onClick={handleVerifyAccount}
                disabled={verifying || !accountNumber || !bankCode}
                className="w-full"
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Verify Bank Account
                  </>
                )}
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> We securely verify your account details with your bank
                through Paystack. This ensures withdrawals go to your verified account only.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
