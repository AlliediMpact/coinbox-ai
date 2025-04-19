'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';

export default function PaymentCallbackPage() {
  const [verifying, setVerifying] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeSignUp } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        const reference = searchParams.get('reference');
        if (!reference) {
          throw new Error('No payment reference found');
        }

        // Get stored signup data
        const pendingSignupStr = localStorage.getItem('pending_signup');
        if (!pendingSignupStr) {
          throw new Error('No pending signup data found');
        }

        const pendingSignup = JSON.parse(pendingSignupStr);
        
        // Complete signup with payment reference
        await completeSignUp({
          ...pendingSignup,
          paymentReference: reference
        });

        toast({
          title: "Account Created Successfully",
          description: "Please check your email to verify your account.",
        });

        // Redirect to profile completion
        router.push('/dashboard/profile');
      } catch (error: any) {
        console.error('Payment callback error:', error);
        toast({
          title: "Payment Verification Failed",
          description: error.message,
          variant: "destructive",
        });
        router.push('/auth'); // Redirect back to auth page on failure
      } finally {
        setVerifying(false);
      }
    };

    handlePaymentCallback();
  }, [searchParams, completeSignUp, router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle>Payment Verification</CardTitle>
          <CardDescription>
            {verifying ? "Verifying your payment..." : "Payment verification complete"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            {verifying ? (
              <p>Please wait while we verify your payment...</p>
            ) : (
              <p>You will be redirected shortly...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}