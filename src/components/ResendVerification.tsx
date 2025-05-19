'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, Mail } from 'lucide-react';

interface ResendVerificationProps {
  email?: string;
}

/**
 * A reusable component for resending email verification links
 */
export default function ResendVerification({ email }: ResendVerificationProps) {
  const [isSending, setIsSending] = useState(false);
  const { resendVerificationEmail } = useAuth();
  const { toast } = useToast();

  const handleResend = async () => {
    setIsSending(true);
    try {
      await resendVerificationEmail();
      toast({
        title: 'Verification Email Sent',
        description: `A new verification link has been sent to ${email || 'your email'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Send',
        description: error.message || 'Could not resend verification email',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full mt-4"
      onClick={handleResend}
      disabled={isSending}
    >
      {isSending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Mail className="mr-2 h-4 w-4" />
          Resend Verification Email
        </>
      )}
    </Button>
  );
}
