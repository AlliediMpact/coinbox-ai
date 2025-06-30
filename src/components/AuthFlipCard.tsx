'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, Mail, Lock, User, Phone, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type AuthSide = 'signin' | 'signup' | 'reset';

interface AuthFlipCardProps {
  onMfaRequired?: (error: any) => void;
  onVerificationReminder?: (email: string) => void;
}

const AuthFlipCard: React.FC<AuthFlipCardProps> = ({
  onMfaRequired,
  onVerificationReminder,
}) => {
  const [currentSide, setCurrentSide] = useState<AuthSide>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [membershipTier, setMembershipTier] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { signIn, signUp, sendPasswordReset } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      toast({
        title: "Sign in successful!",
        description: "Welcome back to Allied iMpact Coin Box",
      });
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      // Handle MFA required error
      if (error.code === 'auth/multi-factor-auth-required') {
        if (onMfaRequired) {
          onMfaRequired(error);
        }
        return;
      }
      
      // Handle email verification required
      if (error.message?.includes('email-not-verified')) {
        if (onVerificationReminder) {
          onVerificationReminder(email);
        }
        return;
      }
      
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "Failed to sign in. Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signUp(email, password, { fullName, phone, referralCode, membershipTier });
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      
      // Switch back to signin
      setCurrentSide(&apos;signin&apos;);
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "Failed to create account. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await sendPasswordReset(email);
      setResetSent(true);
      toast({
        title: "Reset Link Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Failed to send reset link. Please check your email.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const variants = {
    signin: { rotateY: 0 },
    signup: { rotateY: 180 },
    reset: { rotateY: -180 }
  };

  return (
    <div className="h-[600px] w-full max-w-md mx-auto perspective-1000">
      <motion.div
        className="relative w-full h-full preserve-3d"
        animate={currentSide}
        variants={variants}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Sign In Side */}
        <motion.div 
          className={`absolute w-full h-full backface-hidden ${currentSide !== 'signin' ? 'hidden' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: currentSide === 'signin' ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full h-full flex flex-col border-2 border-primary-blue/20 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent">Sign In</CardTitle>
              <CardDescription>Enter your email and password to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email Address"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Password"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-primary-blue to-primary-purple"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Sign In
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 mt-auto">
              <Button 
                variant="link" 
                onClick={() => setCurrentSide(&apos;reset&apos;)}
                className="text-primary-blue"
              >
                Forgot Password?
              </Button>
              <div className="text-center">
                <span className="text-sm text-muted-foreground">Don&apos;t have an account? </span>
                <Button 
                  variant="link" 
                  className="text-primary-purple p-0" 
                  onClick={() => setCurrentSide(&apos;signup&apos;)}
                >
                  Sign Up
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Sign Up Side */}
        <motion.div 
          className={`absolute w-full h-full backface-hidden rotate-y-180 ${currentSide !== 'signup' ? 'hidden' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: currentSide === 'signup' ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full h-full flex flex-col border-2 border-primary-purple/20 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent">Sign Up</CardTitle>
              <CardDescription>Create a new account to join our platform</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Full Name"
                      className="pl-10"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email Address"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Phone Number"
                      className="pl-10"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Password"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Gift className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Referral Code (Optional)"
                      className="pl-10"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <Select
                      value={membershipTier}
                      onValueChange={setMembershipTier}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Membership Tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="platinum">Platinum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-primary-blue to-primary-purple"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Sign Up
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center mt-auto">
              <Button 
                variant="link" 
                className="text-primary-blue" 
                onClick={() => setCurrentSide(&apos;signin&apos;)}
              >
                Already have an account? Sign In
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Password Reset Side */}
        <motion.div 
          className={`absolute w-full h-full backface-hidden rotate-y-minus-180 ${currentSide !== 'reset' ? 'hidden' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: currentSide === 'reset' ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full h-full flex flex-col border-2 border-primary-blue/20 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent">Reset Password</CardTitle>
              <CardDescription>
                {resetSent 
                  ? "Password reset link has been sent. Check your email." 
                  : "Enter your email to receive a password reset link"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!resetSent ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email Address"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-primary-blue to-primary-purple"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Send Reset Link
                  </Button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4 py-6">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  >
                    <div className="rounded-full bg-gradient-to-r from-primary-blue to-primary-purple p-2">
                      <Mail className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>
                  <p className="text-center">
                    We&apos;ve sent a password reset link to <span className="font-bold">{email}</span>. 
                    Please check your inbox and follow the instructions to reset your password.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setResetSent(false);
                      setEmail(&apos;&apos;);
                    }}
                    className="mt-4"
                  >
                    Try a different email
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center mt-auto">
              <Button 
                variant="link" 
                className="text-primary-blue" 
                onClick={() => {
                  setCurrentSide(&apos;signin&apos;);
                  setResetSent(false);
                }}
              >
                Back to Sign In
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .rotate-y-minus-180 {
          transform: rotateY(-180deg);
        }
      `}</style>
    </div>
  );
};

export default AuthFlipCard;