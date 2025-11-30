'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

// Define PasswordRequirement interface for client-side validation feedback
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

export default function CompleteSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // We no longer fetch userData from localStorage here
  // const [userData, setUserData] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
   const [passwordRequirements, setPasswordRequirements] = useState<boolean[]>((
    new Array(PASSWORD_REQUIREMENTS.length).fill(false)
  ));

  // Get paymentReference and temporaryId from URL
  const paymentReference = searchParams.get('reference');
  const temporaryId = searchParams.get('temporaryId');


   useEffect(() => {
    // Client-side password requirements feedback
    const newRequirements = PASSWORD_REQUIREMENTS.map(req => req.regex.test(password));
    setPasswordRequirements(newRequirements);
  }, [password]);


  useEffect(() => {
    // Redirect if essential data is missing
    if (!paymentReference || !temporaryId) {
         toast({
          title: "Missing Data",
          description: "Required registration data is missing. Please start the sign-up process again.",
          variant: "destructive",
         });
          router.replace('/auth/signup'); // Use replace to prevent going back to this page
    }
    // We don't fetch userData from localStorage anymore
  }, [router, paymentReference, temporaryId, toast]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure essential data is present before submitting
    if (!paymentReference || !temporaryId || !password) {
       toast({
        title: "Missing Information",
        description: "Payment reference, temporary ID, or password is missing.",
        variant: "destructive",
      });
      return;
    }

    // Client-side password validation feedback (server will re-validate)
     if (!passwordRequirements.every(req => req)) {
      toast({
        title: "Invalid Password",
        description: "Please meet all password requirements",
        variant: "destructive",
      });
      return;
    }


    setIsLoading(true);
    try {
      // Call the server-side signup API route
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          temporaryId,
          password,
          paymentReference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred during registration completion.');
      }

      // Success: User created on the server
      // No localStorage to clear anymore

      toast({
        title: "You're all set!",
        description: "Your CoinBox account is ready. Redirecting to your profile...",
      });

      // Redirect to My Profile as requested
      router.push('/dashboard/profile'); // Assuming you have a page at /auth/verify-email

    } catch (error: any) {
      console.error("Complete signup error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || 'An unexpected error occurred.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render a loading/processing state while the page initially loads or if data is missing
   if (!paymentReference || !temporaryId) {
       return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-[400px]">
                    <CardHeader>
                        <CardTitle>Loading Registration Data...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-[#193281]" />
                            <p className="text-center text-gray-600">
                                Please wait while we load your registration details.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
       );
   }


  // If paymentReference and temporaryId are present, show the password form
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
             {/* We can't display specific user data (email, name) here anymore
                 as it's not fetched on the client for security. */}
             <p className="text-sm text-gray-700">
                 Please enter your password to complete your registration.
             </p>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
             {/* Password requirements feedback */}
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
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !password || !passwordRequirements.every(req => req)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing Registration...
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
