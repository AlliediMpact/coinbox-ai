'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/AuthProvider';
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
  { regex: /[!@#$%^&*(),.?":{}|<>]/, message: "Contains special character" }
];

const MEMBERSHIP_TIERS: { [key: string]: { securityFee: number } } = {
  Basic: { securityFee: 1000 },
  Ambassador: { securityFee: 2000 },
  VIP: { securityFee: 3000 },
  Business: { securityFee: 4000 },
};

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [password, setPassword] = useState('');
  const [membershipTier, setMembershipTier] = useState('Basic');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerifyNotice, setShowVerifyNotice] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState<boolean[]>(
    new Array(PASSWORD_REQUIREMENTS.length).fill(false)
  );
  const [showPassword, setShowPassword] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const newRequirements = PASSWORD_REQUIREMENTS.map(req => req.regex.test(password));
    setPasswordRequirements(newRequirements);
  }, [password]);

  const handlePaystackPayment = () => {
    // Save user data (except password) to localStorage
    localStorage.setItem(
      "pending_signup",
      JSON.stringify({
        fullName,
        email,
        phone,
        referralCode,
        membershipTier,
      })
    );

    // Get the selected tier's security fee
    const tierConfig = MEMBERSHIP_TIERS[membershipTier];
    const amount = tierConfig?.securityFee ? tierConfig.securityFee * 100 : 0; // Paystack expects kobo/cents

    // @ts-ignore
    const handler = window.PaystackPop && window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email,
      amount,
      currency: "ZAR", // or "NGN" if using Naira
      callback: function (response: any) {
        // Redirect to complete-signup page with payment reference
        window.location.href = `/auth/complete-signup?reference=${response.reference}`;
      },
      onClose: function () {
        // Optionally notify user payment was cancelled
      },
    });

    if (handler) handler.openIframe();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordRequirements.every(req => req)) {
      toast({
        title: "Invalid Password",
        description: "Please meet all password requirements",
        variant: "destructive",
      });
      return;
    }
    // Instead of calling signUp, start Paystack payment
    handlePaystackPayment();
  };

  return (
    <>
      {/* Paystack inline script */}
      <Script src="https://js.paystack.co/v1/inline.js" strategy="beforeInteractive" />
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-[450px]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription>Enter your details to create an account</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
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
                  disabled={isLoading || !passwordRequirements.every(req => req)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
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
          </CardContent>
        </Card>
      </div>
    </>
  );
}
