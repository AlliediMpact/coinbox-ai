'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import ResendVerification from '@/components/ResendVerification';
import MfaVerification from '@/components/MfaVerification';
import { RecaptchaVerifier } from 'firebase/auth';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  // Add states for MFA handling
  const [mfaError, setMfaError] = useState<any>(null);
  const [mfaInProgress, setMfaInProgress] = useState(false);

  const { signIn, sendPasswordReset, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isResetMode) {
        await sendPasswordReset(email);
        setResetSent(true);
        toast({
          title: "Reset Link Sent",
          description: "Check your email for password reset instructions.",
        });
      } else {
        await signIn(email, password);
        // Redirect is handled within the signIn function in AuthProvider
      }
    } catch (err: any) {
      console.error("Authentication failed:", err.message);
      const errorMessage = err.message || 'Authentication failed';

      // Check if this is an MFA error
      if (err.code === 'auth/multi-factor-auth-required') {
        // Handle MFA challenge
        setMfaError(err);
        setMfaInProgress(true);
        return; // Don't show other error messages
      }
      
      // Handle rate limiting error
      if (err.message?.includes('Too many login attempts')) {
        // Note: Rate-limiting headers might not be accessible on the client-side
        // A server-side check or Firebase Auth's built-in protections are more robust
        const waitTime = 900; // Default to 15 minutes if header not accessible
        toast({
          title: "Too Many Attempts",
          description: `Please try again after ${Math.ceil(waitTime / 60)} minutes`,
          variant: "destructive",
        });
      } else if (err.message?.includes('Please verify your email')) {
         toast({
          title: "Email Not Verified",
          description: "Please verify your email to continue. Check your inbox for a verification link.",
          variant: "destructive",
          duration: 6000, // Show longer for this important message
        });
        // Show the verification reminder UI
        setUnverifiedEmail(email);
        setShowVerificationReminder(true);
      }
      else {
        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      if (!mfaInProgress) {
        setIsLoading(false);
      }
    }
  };

  // Handle MFA verification success
  const handleMfaSuccess = (userCredential: any) => {
    setMfaInProgress(false);
    setMfaError(null);
    setIsLoading(false);
    
    toast({
      title: "Authentication Successful",
      description: "Two-factor authentication verified successfully.",
    });
    
    // The onAuthStateChanged in AuthProvider will handle redirects
    router.push('/dashboard');
  };

  // Handle MFA verification cancellation
  const handleMfaCancel = () => {
    setMfaInProgress(false);
    setMfaError(null);
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-[400px]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">
            {mfaInProgress ? 'Two-Factor Authentication' : 
              (isResetMode ? 'Reset Password' : 'Login')}
          </CardTitle>
          <CardDescription>
            {mfaInProgress ? 'Enter the verification code sent to your phone' :
              (isResetMode
                ? 'Enter your email to receive a reset link'
                : 'Welcome back! Please enter your details')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mfaInProgress && mfaError ? (
            <MfaVerification 
              error={mfaError}
              phoneNumber={email} // Pass the email as a reference to the user
              onSuccess={handleMfaSuccess}
              onCancel={handleMfaCancel}
            />
          ) : resetSent ? (
            <div className="text-center space-y-4">
              <p className="text-lg text-[#193281] font-semibold">
                Password reset link sent!
              </p>
              <p className="text-sm text-gray-500">
                Check your email for instructions to reset your password.
              </p>
              <Button onClick={() => {
                setIsResetMode(false);
                setResetSent(false); // Allow sending another reset if needed
                setEmail(''); // Clear email field
              }}>
                Back to Login
              </Button>
            </div>
          ) : (
            showVerificationReminder ? (
              <div className="space-y-4">
                <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.485 2.495a.75.75 0 01.982 0l8.5 7.5a.75.75 0 01-.482 1.32H1.5a.75.75 0 01-.482-1.32l8.5-7.5zM4 12h12v3.75a.75.75 0 01-.75.75h-10.5a.75.75 0 01-.75-.75V12z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-amber-800">
                        Please check your inbox for a verification email sent to <strong>{unverifiedEmail}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
                <ResendVerification email={unverifiedEmail} />
                <Button
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => setShowVerificationReminder(false)}
                >
                  Try a different account
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
                {!isResetMode && (
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                )}
                <Button
                  type="submit"
                  className="w-full text-white hover:bg-[#5e17eb]"
                  style={{ 
                    backgroundColor: '#193281', 
                    transition: 'background-color 0.3s ease'
                  }}
                  disabled={isLoading || (!isResetMode && (!email || !password)) || (isResetMode && !email)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isResetMode ? 'Sending...' : 'Signing in...'}
                    </>
                  ) : (
                    isResetMode ? 'Send Reset Link' : 'Login'
                  )}
                </Button>
                <div className="flex justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(!isResetMode);
                      // Clear inputs when switching modes
                      setEmail('');
                      setPassword('');
                      setResetSent(false);
                    }}
                    className="text-[#193281] hover:text-[#5e17eb]"
                    disabled={isLoading}
                  >
                    {isResetMode ? 'Back to Login' : 'Forgot Password?'}
                  </button>
                  {!isResetMode && (
                    <Link
                      href="/auth/signup"
                      className="text-[#193281] hover:text-[#5e17eb]"
                    >
                      Create Account
                    </Link>
                  )}
                </div>
              </form>
            )
          )}
          {/* MFA Verification Component */}
          {mfaInProgress && mfaError && (
            <MfaVerification
              error={mfaError}
              onSuccess={handleMfaSuccess}
              onCancel={handleMfaCancel}
              email={email} // Pass email to MFA component
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
