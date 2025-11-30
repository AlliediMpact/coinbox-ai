'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/AuthProvider'; // Keep useAuth if other functions like signIn/signOut are used elsewhere
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Script from "next/script";

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

  return (
    <> {/* This fragment wraps the entire return content */}
      {/* Paystack inline script */}
      <Script src="https://js.paystack.co/v1/inline.js" strategy="beforeInteractive" />
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white to-neutral-lightest p-4">
        <Card className="w-full max-w-xl shadow-2xl border border-slate-200/80">
          <CardHeader className="space-y-4 pb-3">
            <div>
              <CardTitle className="text-2xl font-semibold">Create your CoinBox account</CardTitle>
              <CardDescription>
                Join a regulated P2P network with protected deposits and referral rewards.
              </CardDescription>
            </div>

            {/* 4-step wizard header */}
            <div className="flex flex-col gap-2">
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
                              ? 'bg-blue-600 text-white border-blue-300'
                              : 'bg-slate-100 text-slate-500 border-slate-300'
                          }`}
                        >
                          {completed ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                        </div>
                        <span className={active ? 'text-slate-900' : 'text-slate-500'}>{label}</span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="hidden sm:block h-0.5 w-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                Step {currentStep + 1} of {steps.length}. You’ll review your details before paying your refundable security deposit.
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-2">
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
                  <form onSubmit={handleSubmit} className="grid gap-4">
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

                        <Button
                          type="submit"
                          className="w-full mt-3 flex items-center justify-center gap-2"
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
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </>
                    )}

                    {/* Wizard navigation buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={currentStep === 0 || isLoading}
                        onClick={handleBack}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        Back
                      </Button>
                      {currentStep < 3 && (
                        <Button
                          type="button"
                          variant="default"
                          onClick={handleNext}
                          disabled={isLoading}
                          className="flex items-center gap-2"
                        >
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="text-center text-sm mt-1">
                      <span className="text-gray-600">Already have an account? </span>
                      <Button
                        variant="link"
                        className="p-0 h-auto font-semibold text-[#193281] hover:text-[#5e17eb]"
                        onClick={() => router.push('/auth')}
                        disabled={isLoading}
                      >
                        Sign in
                      </Button>
                    </div>
                  </form>
                )}
            </>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
