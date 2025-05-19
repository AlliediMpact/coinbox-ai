'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/AuthProvider';
import { paystackService } from '@/lib/paystack-service';
import { MEMBERSHIP_TIERS } from '@/lib/membership-tiers';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function MembershipManagement() {
  const [selectedTier, setSelectedTier] = useState(MEMBERSHIP_TIERS.Basic);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleUpgrade = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "Please log in to upgrade your membership",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setPaymentStatus('processing');

    try {
      // Initialize payment
      const response = await paystackService.initializePayment(
        user.uid,
        user.email,
        selectedTier.securityFee,
        {
          membershipTier: selectedTier.name,
          metadata: {
            securityFee: selectedTier.securityFee,
            refundableAmount: selectedTier.refundableAmount,
            administrationFee: selectedTier.administrationFee
          }
        }
      );

      // Redirect to Paystack
      if (response.status && response.data.authorization_url) {
        window.location.href = response.data.authorization_url;
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (error) {
      setPaymentStatus('error');
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check URL parameters for payment status on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const reference = queryParams.get('reference');
    const status = queryParams.get('status');

    if (reference && status === 'success') {
      setPaymentStatus('success');
      toast({
        title: "Payment Successful",
        description: "Your membership has been upgraded successfully!",
        variant: "default"
      });
    }
  }, [toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership Management</CardTitle>
        <CardDescription>View and manage your membership tier.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="membership">Select Membership Tier</label>
          <Select 
            onValueChange={(value) => {
              const tier = MEMBERSHIP_TIERS[value as keyof typeof MEMBERSHIP_TIERS];
              if (tier) setSelectedTier(tier);
            }}
            disabled={isLoading || paymentStatus === 'processing'}
          >
            <SelectTrigger id="membership">
              <SelectValue placeholder={selectedTier.name} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MEMBERSHIP_TIERS).map(([key, tier]) => (
                <SelectItem key={key} value={key}>
                  {tier.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <p><strong>Security Fee:</strong> R{selectedTier.securityFee.toLocaleString()}</p>
          <p><strong>Loan Limit:</strong> R{selectedTier.loanLimit.toLocaleString()}</p>
          <p><strong>Investment Limit:</strong> R{selectedTier.investmentLimit.toLocaleString()}</p>
          <p><strong>Commission Rate:</strong> {selectedTier.commissionRate}%</p>
          <div className="mt-2">
            <h4 className="font-semibold mb-2">Benefits:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {selectedTier.benefits.map((benefit, index) => (
                <li key={index} className="text-sm">{benefit}</li>
              ))}
            </ul>
          </div>
        </div>

        {paymentStatus === 'success' && (
          <Alert className="bg-green-50">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Payment Successful!</AlertTitle>
            <AlertDescription>
              Your membership has been upgraded to {selectedTier.displayName}.
            </AlertDescription>
          </Alert>
        )}

        {paymentStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Failed</AlertTitle>
            <AlertDescription>
              There was an error processing your payment. Please try again.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleUpgrade}
          disabled={isLoading || paymentStatus === 'processing'}
          className="w-full"
        >
          {isLoading ? 'Processing...' : `Upgrade to ${selectedTier.displayName}`}
        </Button>
      </CardFooter>
    </Card>
  );
}
