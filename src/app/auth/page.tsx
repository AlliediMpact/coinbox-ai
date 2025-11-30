'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Note: animations removed here to avoid hydration/visibility issues on auth page
import { useAuth } from '@/components/AuthProvider';
import ResendVerification from '@/components/ResendVerification';
import MfaVerification from '@/components/MfaVerification';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [mfaError, setMfaError] = useState<any>(null);
  const [mfaInProgress, setMfaInProgress] = useState(false);

  const { signIn, sendPasswordReset, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const validateEmail = (value: string) => {
    if (!value) return 'Email is required';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) return 'Please enter a valid email address';
    return null;
  };
  
  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    setEmailError(null);
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

      // Normalize Firebase auth errors into user-friendly messages
      let friendlyMessage = 'Authentication failed. Please check your details and try again.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        friendlyMessage = 'Incorrect email or password. Please try again.';
      } else if (err.code === 'auth/user-not-found') {
        friendlyMessage = 'No account found with that email address.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many attempts. Please wait a few minutes before trying again.';
      }

      // Check if this is an MFA error
      if (err.code === 'auth/multi-factor-auth-required') {
        // Handle MFA challenge
        setMfaError(err);
        setMfaInProgress(true);
        return; // Don't show other error messages
      }
      
      // Handle rate limiting error
      if (err.message?.includes('Too many login attempts')) {
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
          description: friendlyMessage,
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
    <div className="w-full flex flex-col items-center px-4 py-10 bg-gradient-to-b from-white to-neutral-lightest">
      <div className="w-full max-w-xl mb-6">
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent">
          Allied iMpact Coin Box
        </h1>
        <p className="text-center text-neutral-dark mb-4">
          Your trusted P2P financial platform
        </p>

        {/* Simple 3-step auth indicator */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <div className={`h-5 w-5 rounded-full border flex items-center justify-center text-[10px] ${!mfaInProgress && !showVerificationReminder ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-100 text-slate-600 border-slate-300'}`}>
              1
            </div>
            <span>Login</span>
          </div>
          <span className="h-px w-8 bg-slate-300" />
          <div className="flex items-center gap-1">
            <div className={`h-5 w-5 rounded-full border flex items-center justify-center text-[10px] ${mfaInProgress ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-100 text-slate-600 border-slate-300'}`}>
              2
            </div>
            <span>MFA</span>
          </div>
          <span className="h-px w-8 bg-slate-300" />
          <div className="flex items-center gap-1">
            <div className={`h-5 w-5 rounded-full border flex items-center justify-center text-[10px] ${showVerificationReminder ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-100 text-slate-600 border-slate-300'}`}>
              3
            </div>
            <span>Verified</span>
          </div>
        </div>
      </div>

      {mfaInProgress && mfaError ? (
        <div className="w-full max-w-xl">
          <MfaVerification 
            error={mfaError}
            phoneNumber={unverifiedEmail} // Using email as a reference
            onSuccess={handleMfaSuccess}
            onCancel={handleMfaCancel}
            email={email}
          />
        </div>
      ) : showVerificationReminder ? (
        <div className="w-full max-w-xl">
          <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-primary-purple/20">
            <div className="rounded-md bg-amber-50 p-4 mb-4 border border-amber-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495a.75.75 0 01.982 0l8.5 7.5a.75.75 0 01-.482 1.32H1.5a.75.75 0 01-.482-1.32l8.5-7.5zM4 12h12v3.75a.75.75 0 01-.75.75h-10.5a.75.75 0 01-.75-.75V12z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-amber-800">
                    Please verify your email address <strong>{unverifiedEmail}</strong> to continue.
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
        </div>
      ) : (
        <div className="w-full max-w-xl bg-white p-10 rounded-xl shadow-2xl border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                required
                disabled={isLoading}
                className={emailError ? 'border-destructive' : undefined}
              />
              {emailError && (
                <p className="text-xs text-destructive mt-0.5">{emailError}</p>
              )}
            </div>
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
              <p className="mt-2 text-xs text-center text-slate-500">
                {!mfaInProgress && !showVerificationReminder && !isResetMode && 'Step 1 of 3: Enter your login details to continue.'}
                {mfaInProgress && 'Step 2 of 3: Confirm the MFA code sent to you.'}
                {showVerificationReminder && !mfaInProgress && 'Final step: Verify your email to activate full access.'}
                {isResetMode && 'We’ll email you a secure link to reset your password.'}
              </p>
            <div className="flex justify-between text-sm pt-1">
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
        </div>
      )}
    </div>
  );
}
