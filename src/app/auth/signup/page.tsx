'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/AuthProvider'; // Keep useAuth if other functions like signIn/signOut are used elsewhere
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, Lock } from 'lucide-react';
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
  // const { signUp } = useAuth(); // signUp is now fully server-side
  const { toast } = useToast();
  const router = useRouter();

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

  return (
    <> {/* This fragment wraps the entire return content */}
      {/* Paystack inline script */}
      <Script src="https://js.paystack.co/v1/inline.js" strategy="beforeInteractive" />
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-[450px]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription>Enter your details to create an account</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
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
                  <form onSubmit={handleSubmit} className="grid gap-3">
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <Input
                      type="tel"
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <Input
                      type="text"
                      placeholder="Referral Code (Optional)"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      disabled={isLoading}
                    />
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock size={18} />
                      </span>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="space-y-1">
                      {PASSWORD_REQUIREMENTS.map((req, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          {passwordRequirements[index] ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className={passwordRequirements[index] ? "text-green-700" : "text-red-700"}>
                            {req.message}
                          </span>
                        </div>
                      ))}
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
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Ambassador">Ambassador</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !passwordRequirements.every(req => req) || !fullName || !email || !phone || !membershipTier || !password}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Sign Up'
                      )}
                    </Button>
                    <div className="text-center text-sm">
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
