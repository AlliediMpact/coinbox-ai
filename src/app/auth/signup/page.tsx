'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/AuthProvider'; // Keep useAuth if other functions like signIn/signOut are used elsewhere
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Script from "next/script";

import Link from 'next/link';

interface PasswordRequirement {
  regex: RegExp;
  message: string;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { regex: /.{8,}/, message: "At least 8 characters long" },
  { regex: /[A-Z]/, message: "Contains uppercase letter" },
  { regex: /[a-z]/, message: "Contains lowercase letter" },
  { regex: /[0-9]/, message: "Contains number" },
  { regex: /[!@#$%^&*(),.?":{}|<>]/.test, message: "Contains special character" } // Fixed regex test
];

// Define PaystackPop on the Window interface
declare global {
    interface Window {
        PaystackPop: {
            setup: (options: any) => { openIframe: () => void };
        } | undefined;
    }
}

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [password, setPassword] = useState('');
  const [membershipTier, setMembershipTier] = useState('Basic'); // Default to Basic
  const [isLoading, setIsLoading] = useState(false);
  const [showVerifyNotice, setShowVerifyNotice] = useState(false); // This state might become less relevant here
  const [pendingEmail, setPendingEmail] = useState(''); // This state might become less relevant here
  const [passwordRequirements, setPasswordRequirements] = useState<boolean[]>(
    new Array(PASSWORD_REQUIREMENTS.length).fill(false)
  );
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  // const { signUp } = useAuth(); // signUp is now fully server-side
  const { toast } = useToast();
  const router = useRouter();

  const steps = [
    'Account details',
    'Security & password',
    'Membership tier',
    'Review & pay',
  ];

  useEffect(() => {
    const newRequirements = PASSWORD_REQUIREMENTS.map(req => req.regex.test(password));
    setPasswordRequirements(newRequirements);
  }, [password]);

  const handlePaystackPayment = (temporaryId: string, amountKobo: number) => {
    setIsLoading(true); // Keep loading true during payment process

    if (!window.PaystackPop) {
        toast({
            title: "Payment Error",
            description: "Paystack script not loaded.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email,
      amount: amountKobo,
      currency: "ZAR",
      callback: function (response: any) {
        setIsLoading(false);
        // Redirect to complete-signup page with payment reference AND temporaryId
        // Note: Passing temporaryId in URL params is a temporary solution for demonstration.
        // A more secure way is to use Paystack webhooks and retrieve metadata server-side.
        router.push(`/auth/complete-signup?reference=${response.reference}&temporaryId=${temporaryId}`);
      },
      onClose: function () {
        setIsLoading(false);
        toast({
            title: "Payment Cancelled",
            description: "You cancelled the payment process.",
            variant: "default",
        });
      },
      // Include temporaryId in metadata for potential webhook usage later
      metadata: {
          temporaryId: temporaryId,
          // Add other relevant metadata if needed
      }
    });

    handler.openIframe();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only submit on final step
    if (currentStep < steps.length - 1) {
      return;
    }

    setIsLoading(true); // Start loading for the API call

    // Client-side password validation for immediate feedback
    if (!passwordRequirements.every(req => req)) {
      toast({
        title: "Invalid Password",
        description: "Please meet all password requirements",
        variant: "destructive",
      });
      setIsLoading(false); // Stop loading if client validation fails
      return;
    }

     // Basic client-side validation for required fields before hitting the API
    if (!fullName || !email || !phone || !membershipTier || !password) {
       toast({
           title: "Missing Fields",
           description: "Please fill in all required fields.",
           variant: "destructive",
       });
        setIsLoading(false);
       return;
    }

    try {
        // 1. Call server-side endpoint to create a pending user and get payment details
        const response = await fetch('/api/auth/create-pending-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fullName,
                email,
                phone,
                referralCode,
                membershipTier,
                // Password is NOT sent in this initial call
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Server-side validation failed or other API error
            toast({
                title: "Sign Up Failed",
                description: data.error || 'An error occurred during preliminary signup.',
                variant: "destructive",
            });
             setIsLoading(false); // Stop loading on API error
            return;
        }

        // Success: Pending user created on server. Initiate payment.
        const { temporaryId, expectedAmountKobo } = data;

        // 2. Initiate Paystack payment using the data from the server response
        handlePaystackPayment(temporaryId, expectedAmountKobo);


    } catch (error: any) {
        console.error("Sign up process error:", error);
        toast({
            title: "Sign Up Error",
            description: error.message || 'An unexpected error occurred.',
            variant: "destructive",
        });
        setIsLoading(false); // Stop loading on fetch error
    }
  };

  const canGoNextFromStep = (step: number) => {
    if (step === 0) {
      const hasFullName = !!fullName.trim();
      const hasEmail = !!email.trim();
      const hasPhone = !!phone.trim();

      setFullNameError(hasFullName ? null : 'Please enter your full name');
      setEmailError(hasEmail ? null : 'Email is required');
      setPhoneError(hasPhone ? null : 'Phone number is required');

      return hasFullName && hasEmail && hasPhone;
    }
    if (step === 1) {
      return passwordRequirements.every(Boolean) && !!password;
    }
    if (step === 2) {
      return !!membershipTier;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep >= steps.length - 1) return;
    if (!canGoNextFromStep(currentStep)) {
      toast({
        title: "Complete this step first",
        description: "Please fill in the required details before continuing.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (isLoading) return;
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  // Modified handleSubmit to handle "Enter" key for next step
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < steps.length - 1) {
      handleNext();
    } else {
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* Paystack inline script */}
      <Script src="https://js.paystack.co/v1/inline.js" strategy="beforeInteractive" />

      <div className="min-h-screen w-full bg-slate-950 text-slate-50 flex flex-col lg:flex-row">
        {/* Left brand panel (mirrors login but signup-focused) */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.38),_transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
            <div>
              <p className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/15 text-slate-100 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-2" />
                Membership-first P2P platform
              </p>
              <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight text-slate-50 mb-4">
                Create your CoinBox
                <br />
                membership in a few steps.
              </h1>
              <p className="text-sm text-slate-200/80 max-w-md mb-8">
                Start with a secure, tiered membership that unlocks trading limits, referral rewards, and protected deposits – all under one account.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs text-slate-100/90 max-w-md">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-300" />
                  <div>
                    <p className="font-medium">Tiered protections</p>
                    <p className="text-slate-200/80">Choose a membership tier that matches how you trade and earn.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 mt-0.5 text-sky-200" />
                  <div>
                    <p className="font-medium">Secure onboarding</p>
                    <p className="text-slate-200/80">Verified email, strong password rules, and refundable deposits.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-white/10 pt-4 flex flex-col gap-3 text-xs text-slate-200/80">
              <p className="uppercase tracking-[0.2em] text-[11px] text-slate-200/70">Membership journey</p>
              <div className="flex flex-wrap gap-4 text-[11px] font-medium text-slate-100/80">
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">Step 1: Details</span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">Step 2: Security</span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">Step 3: Tier</span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">Step 4: Deposit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right signup wizard column */}
        <div className="flex-1 flex items-center justify-center px-4 py-10 bg-gradient-to-b from-white to-slate-50 lg:py-0">
          <div className="w-full max-w-md">
            {/* Mobile heading */}
            <div className="lg:hidden text-center space-y-2 mb-6">
              <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent">
                Allied iMpact Coin Box
              </h1>
              <p className="text-xs text-slate-600">
                Create a CoinBox membership with secure onboarding and a refundable deposit.
              </p>
            </div>

            {/* 4-step wizard header */}
            <div className="flex flex-col gap-2 mb-5">
              <div className="flex justify-between items-center text-xs sm:text-sm text-slate-600 font-medium">
                {steps.map((label, index) => {
                  const active = index === currentStep;
                  const completed = index < currentStep;
                  return (
                    <div key={label} className="flex-1 flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                            completed
                              ? 'bg-emerald-400 text-slate-900 border-emerald-300'
                              : active
                              ? 'bg-blue-600 text-white border-blue-400'
                              : 'bg-slate-100 text-slate-500 border-slate-300'
                          }`}
                        >
                          {completed ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                        </div>
                        <span className={active ? 'text-slate-900 font-semibold' : 'text-slate-500'}>{label}</span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="hidden sm:block h-0.5 w-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500">
                Step {currentStep + 1} of {steps.length}. We’ll guide you from basic details to a secure, refundable deposit.
              </p>
            </div>

            <div className="bg-white p-7 sm:p-8 rounded-xl shadow-2xl border border-slate-200/80">
              {/* Wrapped the conditional rendering in a fragment */}
              <>
                {showVerifyNotice ? (
                  <div className="text-center space-y-4">
                    <p className="text-lg text-[#193281] font-semibold">
                      Please verify your email address to activate your account.
                    </p>
                    <p className="text-sm text-gray-500">
                      A verification link has been sent to <span className="font-bold">{pendingEmail}</span>.
                      <br />
                      Check your inbox and follow the instructions.
                    </p>
                    <Button onClick={() => router.push('/auth')}>Go to Login</Button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="grid gap-4">
                    {/* Step 1: account details */}
                    {currentStep === 0 && (
                      <div className="grid gap-3">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-slate-700">Full name</label>
                          <Input
                            type="text"
                            placeholder="Enter your legal name"
                            value={fullName}
                            onChange={(e) => {
                              setFullName(e.target.value);
                              if (fullNameError) setFullNameError(null);
                            }}
                            required
                            disabled={isLoading}
                          />
                          {fullNameError && (
                            <p className="text-xs text-red-600 mt-0.5">{fullNameError}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-slate-700">Email</label>
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
                          />
                          {emailError && (
                            <p className="text-xs text-red-600 mt-0.5">{emailError}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-slate-700">Phone number</label>
                          <Input
                            type="tel"
                            placeholder="e.g. +27 71 234 5678"
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              if (phoneError) setPhoneError(null);
                            }}
                            required
                            disabled={isLoading}
                          />
                          {phoneError && (
                            <p className="text-xs text-red-600 mt-0.5">{phoneError}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-slate-700">Referral code (optional)</label>
                          <Input
                            type="text"
                            placeholder="Have a partner or referrer? Enter their code."
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 2: password requirements */}
                    {currentStep === 1 && (
                      <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-800 flex items-center gap-1">
                            <Lock className="h-4 w-4 text-slate-500" />
                            Secure your account
                          </p>
                          <span className="text-xs text-slate-500">Step 2 • Password</span>
                        </div>
                        <div className="relative mt-1">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                            tabIndex={-1}
                            onClick={() => setShowPassword((v) => !v)}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <div className="space-y-1 pt-1">
                          {PASSWORD_REQUIREMENTS.map((req, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs sm:text-sm">
                              {passwordRequirements[index] ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-slate-300" />
                              )}
                              <span className={passwordRequirements[index] ? "text-emerald-700" : "text-slate-600"}>
                                {req.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 3: membership tier */}
                    {currentStep === 2 && (
                      <div className="mt-1 space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-800">Choose your membership tier</p>
                          <span className="text-xs text-slate-500">Step 3 • Membership</span>
                        </div>
                        <Select
                          onValueChange={(value) => setMembershipTier(value)}
                          defaultValue={membershipTier}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Membership Tier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Basic">Basic – starter limit & core protections</SelectItem>
                            <SelectItem value="Ambassador">Ambassador – higher limits + referral boost</SelectItem>
                            <SelectItem value="VIP">VIP – premium support & fastest settlements</SelectItem>
                            <SelectItem value="Business">Business – team accounts & invoicing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Step 4: review & submit */}
                    {currentStep === 3 && (
                      <>
                        <div className="mt-1 rounded-lg bg-slate-900 text-slate-50 p-3 space-y-2">
                          <div className="space-y-0.5 text-xs sm:text-sm">
                            <p className="font-medium">Review & pay your security deposit</p>
                            <p className="text-slate-300">
                              We’ll calculate the exact deposit for <span className="font-semibold">{membershipTier}</span> on the next screen.
                            </p>
                          </div>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                            <div>
                              <p className="text-slate-400">Name</p>
                              <p className="font-medium text-slate-50 truncate">{fullName || '-'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Email</p>
                              <p className="font-medium text-slate-50 truncate">{email || '-'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Membership</p>
                              <p className="font-medium text-slate-50">{membershipTier}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Wizard navigation buttons */}
                    <div className="flex items-center justify-between pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={currentStep === 0 || isLoading}
                        onClick={handleBack}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        Back
                      </Button>
                      {currentStep < 3 ? (
                        <Button
                          type="button"
                          onClick={handleNext}
                          disabled={isLoading}
                          className="text-white hover:bg-[#5e17eb]"
                          style={{ 
                            backgroundColor: '#193281', 
                            transition: 'background-color 0.3s ease'
                          }}
                        >
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          className="text-white hover:bg-[#5e17eb]"
                          style={{ 
                            backgroundColor: '#193281', 
                            transition: 'background-color 0.3s ease'
                          }}
                          disabled={
                            isLoading ||
                            !passwordRequirements.every(req => req) ||
                            !fullName ||
                            !email ||
                            !phone ||
                            !membershipTier ||
                            !password
                          }
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Continue to secure deposit
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="flex justify-center text-sm pt-2">
                      <span className="text-slate-500 mr-1">Already have an account?</span>
                      <Link
                        href="/auth"
                        className="text-[#193281] hover:text-[#5e17eb] font-medium"
                      >
                        Sign In
                      </Link>
                    </div>
                  </form>
                )}
              </>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
