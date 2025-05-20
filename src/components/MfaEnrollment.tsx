'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { PhoneInput } from './ui/phone-input'; // Assuming a phone input component exists
import { Loader2, Check, XCircle, Phone } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { mfaService } from '@/lib/mfa-service';
import { RecaptchaVerifier } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface MfaEnrollmentProps {
  onCompleted?: () => void;
  onCancel?: () => void;
}

export const MfaEnrollment: React.FC<MfaEnrollmentProps> = ({ onCompleted, onCancel }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize reCAPTCHA verifier on component mount
    if (recaptchaContainerRef.current && !recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = mfaService.initRecaptchaVerifier('recaptcha-container');
        // Force reCAPTCHA to render
        recaptchaVerifierRef.current.render().catch(console.error);
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize security verification. Please try again.',
          variant: 'destructive',
        });
      }
    }

    // Clean up on unmount
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [toast]);

  const handleSendVerificationCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (!recaptchaVerifierRef.current) {
        throw new Error('reCAPTCHA not initialized');
      }

      const vid = await mfaService.startEnrollment(
        phoneNumber,
        recaptchaVerifierRef.current
      );
      
      setVerificationId(vid);
      setCodeSent(true);
      toast({
        title: 'Verification Code Sent',
        description: 'Please enter the verification code sent to your phone.',
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to send verification code.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter the 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (!verificationId) {
        throw new Error('Verification ID not found');
      }

      await mfaService.completeEnrollment(
        verificationId,
        verificationCode,
        displayName || undefined
      );
      
      toast({
        title: 'Success',
        description: 'Two-factor authentication has been set up successfully.',
      });
      
      if (onCompleted) {
        onCompleted();
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast({
        title: 'Verification Failed',
        description: (error as Error).message || 'Failed to verify the code.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Set Up Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account by requiring a verification code from your phone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!codeSent ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone-number" className="text-sm font-medium">
                Phone Number
              </label>
              <PhoneInput
                id="phone-number"
                value={phoneNumber}
                onChange={(value) => setPhoneNumber(value)}
                placeholder="+1 (555) 123-4567"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="display-name" className="text-sm font-medium">
                Device Name (Optional)
              </label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="My Phone"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                A name to help you identify this device.
              </p>
            </div>
            
            <div id="recaptcha-container" ref={recaptchaContainerRef} className="flex justify-center my-4"></div>
          </div>
        ) : (
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
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit verification code sent to {phoneNumber}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        {!codeSent ? (
          <Button onClick={handleSendVerificationCode} disabled={loading || !phoneNumber}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
            Send Code
          </Button>
        ) : (
          <Button onClick={handleVerifyCode} disabled={loading || verificationCode.length !== 6}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Verify
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default MfaEnrollment;
