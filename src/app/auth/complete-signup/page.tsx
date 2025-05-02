'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function CompleteSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  const { toast } = useToast();

  const [userData, setUserData] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const paymentReference = searchParams.get('reference');

  useEffect(() => {
    const pending = localStorage.getItem('pending_signup');
    if (pending) {
      setUserData(JSON.parse(pending));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !paymentReference) {
      toast({
        title: "Missing Data",
        description: "User data or payment reference is missing.",
        variant: "destructive",
      });
      return;
    }
    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await signUp(
        userData.email,
        password,
        { ...userData, paymentReference }
      );
      localStorage.removeItem('pending_signup');
      toast({
        title: "Registration Complete",
        description: "Your account has been created. Please check your email to verify your account.",
      });
      router.push('/profile');
    } catch (error: any) {
      toast({
        title: "Sign-up Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Complete Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-red-500">No pending registration found. Please start the sign-up process again.</p>
            <Button className="w-full mt-4" onClick={() => router.push('/auth/signup')}>Back to Sign Up</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Complete Registration</CardTitle>
          <CardDescription>
            Enter your password to finish creating your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <div className="text-sm mb-2 text-gray-700">
                <span className="font-semibold">Email:</span> {userData.email}
              </div>
              <div className="text-sm mb-2 text-gray-700">
                <span className="font-semibold">Full Name:</span> {userData.fullName}
              </div>
              <div className="text-sm mb-2 text-gray-700">
                <span className="font-semibold">Membership:</span> {userData.membershipTier}
              </div>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
