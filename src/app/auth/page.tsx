'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Note: animations removed here to avoid hydration/visibility issues on auth page
import { useAuth } from '@/components/AuthProvider';
import ResendVerification from '@/components/ResendVerification';
import MfaVerification from '@/components/MfaVerification';
import { Loader2, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-slate-950 text-slate-50 flex flex-col lg:flex-row">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.38),_transparent_60%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <div>
            <p className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/15 text-slate-100 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-2" />
              Regulated P2P membership platform
            </p>
            <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight text-slate-50 mb-4">
              All your CoinBox
              <br />
              membership access in one login.
            </h1>
            <p className="text-sm text-slate-200/80 max-w-md mb-8">
              Sign in once to manage trading, wallets, referrals, and membership rewards with bank-grade protection and smart risk controls.
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-100/90 max-w-md">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-300" />
                <div>
                  <p className="font-medium">Bank-grade protection</p>
                  <p className="text-slate-200/80">2FA-ready with real-time fraud flags and dispute workflows.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 mt-0.5 text-sky-200" />
                <div>
                  <p className="font-medium">Secure by default</p>
                  <p className="text-slate-200/80">Encrypted sessions and protected deposits on every membership.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-4 flex flex-col gap-3 text-xs text-slate-200/80">
            <p className="uppercase tracking-[0.2em] text-[11px] text-slate-200/70">Trusted membership stack</p>
            <div className="flex flex-wrap gap-4 text-[11px] font-medium text-slate-100/80">
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">FSCA-aligned</span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">SARB-ready flows</span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">Bank-grade KYC paths</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right auth column */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 bg-gradient-to-b from-white to-slate-50 lg:py-0">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile heading */}
          <div className="lg:hidden text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent">
              Allied iMpact Coin Box
            </h1>
            <p className="text-xs text-slate-600">
              Sign in to access your membership, wallet and trading tools.
            </p>
          </div>

          {/* Simple 3-step indicator */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600">
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

          {mfaInProgress && mfaError ? (
            <MfaVerification
              error={mfaError}
              phoneNumber={unverifiedEmail}
              onSuccess={handleMfaSuccess}
              onCancel={handleMfaCancel}
              email={email}
            />
          ) : showVerificationReminder ? (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-200/70 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-500">
                  !
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-amber-900">Verify your email to continue</p>
                  <p className="text-amber-800/90">
                    We’ve sent a verification link to <span className="font-semibold">{unverifiedEmail}</span>.
                    Check your inbox and confirm to activate full access.
                  </p>
                </div>
              </div>
              <ResendVerification email={unverifiedEmail} />
              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => setShowVerificationReminder(false)}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <div className="bg-white p-7 sm:p-8 rounded-xl shadow-2xl border border-slate-200/80 space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Welcome back</h2>
                <p className="text-xs text-slate-500">
                  Log in with the email linked to your CoinBox membership.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    required
                    disabled={isLoading}
                    className={emailError ? 'border-destructive' : undefined}
                  />
                  {emailError ? (
                    <p className="text-[11px] text-destructive mt-0.5">{emailError}</p>
                  ) : (
                    <p className="text-[11px] text-slate-500">Use the email you signed up with.</p>
                  )}
                </div>

                {!isResetMode && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 flex items-center justify-between">
                      <span>Password</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsResetMode(true);
                          setResetSent(false);
                        }}
                        className="text-[11px] text-blue-700 hover:text-blue-800"
                        disabled={isLoading}
                      >
                        Forgot?
                      </button>
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                )}

                {isResetMode && (
                  <p className="text-[11px] text-slate-500">
                    We’ll email you a secure link to reset your password. This won’t affect your membership or wallet balances.
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Remember this device</span>
                  </label>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Lock className="h-3 w-3" />
                    Bank-grade encryption
                  </span>
                </div>

                <Button
                  type="submit"
                  className="w-full text-sm text-white hover:bg-[#5e17eb]"
                  style={{
                    backgroundColor: '#193281',
                    transition: 'background-color 0.3s ease',
                  }}
                  disabled={
                    isLoading ||
                    (!isResetMode && (!email || !password)) ||
                    (isResetMode && !email)
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isResetMode ? 'Sending reset link…' : 'Signing in…'}
                    </>
                  ) : (
                    isResetMode ? 'Send reset link' : 'Sign in to CoinBox'
                  )}
                </Button>

                <p className="mt-1 text-[11px] text-center text-slate-500">
                  {!mfaInProgress && !showVerificationReminder && !isResetMode &&
                    'Step 1 of 3: Login. MFA and verification keep your account safe.'}
                  {mfaInProgress && 'Step 2 of 3: Complete the MFA challenge sent to you.'}
                  {showVerificationReminder && !mfaInProgress &&
                    'Final step: Verify your email from your inbox to unlock full access.'}
                  {isResetMode &&
                    'You’ll receive a one-time secure link. For security, it expires after a short time.'}
                </p>
              </form>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-[11px] text-slate-600">
                <div>
                  <span className="mr-1">New to CoinBox?</span>
                  <Link
                    href="/auth/signup"
                    className="font-semibold text-[#193281] hover:text-[#5e17eb]"
                  >
                    Create an account
                  </Link>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Regulated, referral-ready membership platform</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
