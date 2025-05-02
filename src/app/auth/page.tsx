'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, sendPasswordReset } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
        router.push('/dashboard');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Authentication failed';
      
      // Handle rate limiting error
      if (err.message?.includes('Too many login attempts')) {
        const retryAfter = err.headers?.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) : 900; // Default to 15 minutes
        toast({
          title: "Too Many Attempts",
          description: `Please try again after ${Math.ceil(waitTime / 60)} minutes`,
          variant: "destructive",
        });
      } else {
        setError(errorMessage);
        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-[400px]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">
            {isResetMode ? 'Reset Password' : 'Login'}
          </CardTitle>
          <CardDescription>
            {isResetMode 
              ? 'Enter your email to receive a reset link' 
              : 'Welcome back! Please enter your details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetSent ? (
            <div className="text-center space-y-4">
              <p className="text-lg text-[#193281] font-semibold">
                Password reset link sent!
              </p>
              <p className="text-sm text-gray-500">
                Check your email for instructions to reset your password.
              </p>
              <Button onClick={() => setIsResetMode(false)}>
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm text-red-500 font-medium">
                  {error}
                </div>
              )}
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
                className="w-full bg-[#193281] hover:bg-[#5e17eb]"
                disabled={isLoading}
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
                  onClick={() => setIsResetMode(!isResetMode)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
