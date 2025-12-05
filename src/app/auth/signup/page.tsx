'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import Script from "next/script";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle2, Shield, CreditCard, User } from 'lucide-react';

import AuthLayout from '@/components/auth/AuthLayout';
import { AnimatedInput } from '@/components/auth/AnimatedInput';
import AnimatedButton from '@/components/auth/AnimatedButton';
import AnimatedAlert from '@/components/auth/AnimatedAlert';
import PasswordStrength from '@/components/auth/PasswordStrength';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

// Declare PaystackPop on Window
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: any) => { openIframe: () => void };
    } | undefined;
  }
}

interface Step {
  title: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  { title: 'Account Info', icon: <User className="w-5 h-5" /> },
  { title: 'Security', icon: <Shield className="w-5 h-5" /> },
  { title: 'Membership', icon: <CreditCard className="w-5 h-5" /> },
];

export default function SignUpPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [membershipTier, setMembershipTier] = useState('Basic');

  // Validation states
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const { toast } = useToast();
  const router = useRouter();

  // Validation functions
  const validateFullName = (name: string) => {
    if (!name) {
      setFullNameError('Full name is required');
      return false;
    }
    if (name.length < 2) {
      setFullNameError('Name must be at least 2 characters');
      return false;
    }
    setFullNameError('');
    return true;
  };

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setPhoneError('Please enter a valid phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain an uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setPasswordError('Password must contain a lowercase letter');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain a number');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirm: string) => {
    if (!confirm) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (confirm !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return validateFullName(fullName) && validateEmail(email) && validatePhone(phone);
      case 1:
        return validatePassword(password) && validateConfirmPassword(confirmPassword);
      case 2:
        return membershipTier !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && isStepValid()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePaystackPayment = (temporaryId: string, amountKobo: number) => {
    setIsLoading(true);

    if (!window.PaystackPop) {
      toast({
        title: "Payment Error",
        description: "Payment system not loaded. Please refresh the page.",
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
      metadata: {
        temporaryId: temporaryId,
      }
    });

    handler.openIframe();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isStepValid()) {
      setError('Please complete all required fields correctly');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sign up failed. Please try again.');
        setIsLoading(false);
        return;
      }

      const { temporaryId, expectedAmountKobo } = data;
      handlePaystackPayment(temporaryId, expectedAmountKobo);

    } catch (error: any) {
      console.error("Sign up error:", error);
      setError(error.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="lazyOnload"
      />
      
      <AuthLayout
        title="Create Account"
        subtitle="Join CoinBox and start your financial journey"
      >
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center flex-1"
                >
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                    animate={{
                      scale: index === currentStep ? [1, 1.1, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {index < currentStep ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      step.icon
                    )}
                  </motion.div>
                  <span className={`text-xs mt-2 text-center ${
                    index === currentStep ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500'
                  }`}>
                    {step.title}
                  </span>
                </motion.div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 bg-slate-200 dark:bg-slate-700 relative">
                    <motion.div
                      className="h-full bg-blue-600"
                      initial={{ width: '0%' }}
                      animate={{ width: index < currentStep ? '100%' : '0%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div className="mb-6">
              <AnimatedAlert type="error" message={error} />
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 0: Account Info */}
            {currentStep === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <AnimatedInput
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (e.target.value) validateFullName(e.target.value);
                  }}
                  onBlur={() => validateFullName(fullName)}
                  error={fullNameError}
                  disabled={isLoading}
                  autoComplete="name"
                />

                <AnimatedInput
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  error={emailError}
                  disabled={isLoading}
                  autoComplete="email"
                />

                <AnimatedInput
                  label="Phone Number"
                  type="tel"
                  placeholder="+27 123 456 789"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (e.target.value) validatePhone(e.target.value);
                  }}
                  onBlur={() => validatePhone(phone)}
                  error={phoneError}
                  disabled={isLoading}
                  autoComplete="tel"
                />

                <AnimatedInput
                  label="Referral Code (Optional)"
                  type="text"
                  placeholder="Enter referral code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  disabled={isLoading}
                />
              </motion.div>
            )}

            {/* Step 1: Security */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <AnimatedInput
                  label="Password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (confirmPassword) validateConfirmPassword(confirmPassword);
                  }}
                  onBlur={() => validatePassword(password)}
                  error={passwordError}
                  showPasswordToggle
                  disabled={isLoading}
                  autoComplete="new-password"
                />

                <PasswordStrength password={password} />

                <AnimatedInput
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (e.target.value) validateConfirmPassword(e.target.value);
                  }}
                  onBlur={() => validateConfirmPassword(confirmPassword)}
                  error={confirmPasswordError}
                  success={confirmPassword && !confirmPasswordError ? 'Passwords match' : undefined}
                  showPasswordToggle
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </motion.div>
            )}

            {/* Step 2: Membership */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">
                    Select Membership Tier
                  </Label>
                  <Select
                    value={membershipTier}
                    onValueChange={setMembershipTier}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                      <SelectValue placeholder="Choose your plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic - R550</SelectItem>
                      <SelectItem value="Ambassador">Ambassador - R1,100</SelectItem>
                      <SelectItem value="VIP">VIP - R5,500</SelectItem>
                      <SelectItem value="Business">Business - R11,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg"
                >
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    {membershipTier} Plan Benefits
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    {membershipTier === 'Basic' && (
                      <>
                        <li>• R500 Loan Limit</li>
                        <li>• R5,000 Investment Limit</li>
                        <li>• 1% Commission</li>
                      </>
                    )}
                    {membershipTier === 'Ambassador' && (
                      <>
                        <li>• R1,000 Loan Limit</li>
                        <li>• R10,000 Investment Limit</li>
                        <li>• 2% Commission</li>
                      </>
                    )}
                    {membershipTier === 'VIP' && (
                      <>
                        <li>• R5,000 Loan Limit</li>
                        <li>• R50,000 Investment Limit</li>
                        <li>• 3% Commission</li>
                      </>
                    )}
                    {membershipTier === 'Business' && (
                      <>
                        <li>• R10,000 Loan Limit</li>
                        <li>• R100,000 Investment Limit</li>
                        <li>• 5% Commission</li>
                      </>
                    )}
                  </ul>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {currentStep > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1"
              >
                <AnimatedButton
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  disabled={isLoading}
                  className="bg-white dark:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </AnimatedButton>
              </motion.div>
            )}

            {currentStep < steps.length - 1 ? (
              <motion.div
                className="flex-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AnimatedButton
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid() || isLoading}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </AnimatedButton>
              </motion.div>
            ) : (
              <motion.div
                className="flex-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AnimatedButton
                  type="submit"
                  loading={isLoading}
                  loadingText="Processing..."
                  disabled={!isStepValid() || isLoading}
                >
                  Complete Sign Up
                </AnimatedButton>
              </motion.div>
            )}
          </div>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400"
        >
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </motion.div>
      </AuthLayout>
    </>
  );
}
