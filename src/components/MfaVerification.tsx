'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Loader2, Check } from 'lucide-react';
import { mfaService } from '@/lib/mfa-service';
import { MultiFactorResolver, RecaptchaVerifier, UserCredential } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface MfaVerificationProps {
  error: any;
  phoneNumber: string;
  onSuccess: (userCredential: UserCredential) => void;
  onCancel: () => void;
}

export const MfaVerification: React.FC<MfaVerificationProps> = ({ 
  error,
  phoneNumber,
  onSuccess,
  onCancel
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Initialize reCAPTCHA verifier and start MFA challenge on component mount
    const initMfaVerification = async () => {
      if (recaptchaContainerRef.current && !recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current = mfaService.initRecaptchaVerifier('mfa-recaptcha-container');
          // Force reCAPTCHA to render
          await recaptchaVerifierRef.current.render();
          
          // Start the MFA challenge
          setLoading(true);
          const result = await mfaService.processMfaChallenge(
            error,
            phoneNumber,
            recaptchaVerifierRef.current
          );
          
          setVerificationId(result.verificationId);
          setResolver(result.resolver);
          
          toast({
            title: 'Verification Code Sent',
            description: 'Please enter the verification code sent to your phone.',
          });
        } catch (initError) {
          console.error('Error initializing MFA verification:', initError);
          toast({
            title: 'Error',
            description: (initError as Error).message || 'Failed to start verification process.',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    initMfaVerification();

    // Clean up on unmount
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [error, phoneNumber, toast]);

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter the 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    if (!verificationId || !resolver) {
      toast({
        title: 'Error',
        description: 'Verification process not initialized properly.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await mfaService.completeMfaVerification(
        verificationId,
        verificationCode,
        resolver
      );
      
      toast({
        title: 'Success',
        description: 'Verification successful.',
      });
      
      // Call the success callback with the user credential
      onSuccess(userCredential);
    } catch (verifyError) {
      console.error('Error verifying code:', verifyError);
      toast({
        title: 'Verification Failed',
        description: (verifyError as Error).message || 'Failed to verify the code.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the verification code sent to your phone {phoneNumber ? `(${phoneNumber})` : ''} to complete the sign-in process.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="verification-code" className="text-sm font-medium">
              Verification Code
            </label>
            <Input
              id="verification-code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
              placeholder="123456"
              maxLength={6}
              disabled={loading || !verificationId}
            />
            <p className="text-xs text-muted-foreground">
              Enter the 6-digit verification code sent to your phone.
            </p>
          </div>
          
          <div id="mfa-recaptcha-container" ref={recaptchaContainerRef} className="flex justify-center my-4"></div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleVerifyCode} disabled={loading || verificationCode.length !== 6 || !verificationId}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          Verify
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MfaVerification;
