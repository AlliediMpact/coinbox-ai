'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from 'react';
import { Mail, Key, Facebook } from 'lucide-react'; // Import icons
import { cn } from "@/lib/utils";
import React from 'react';
import Image from 'next/image';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSignIn, setShowSignIn] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false); // State for forgot password
  const cardRef = useRef<HTMLDivElement>(null); // Ref for the card element

  useEffect(() => {
    // Animation code using the cardRef
    const card = cardRef.current;

    if (card) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const normalizedX = x / rect.width - 0.5;
        const normalizedY = y / rect.height - 0.5;

        // Tilt settings
        const tiltX = normalizedY * 10; // Reduced tilt
        const tiltY = -normalizedX * 10; // Reduced tilt

        // Parallax settings
        const translateX = normalizedX * 20; // Reduced parallax
        const translateY = normalizedY * 20; // Reduced parallax

        card.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translate(${translateX}px, ${translateY}px)`;
      };

      const handleMouseLeave = () => {
        card.style.transform = `perspective(600px) rotateX(0deg) rotateY(0deg) translate(0, 0)`;
      };

      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/auth/signin'); // Redirect to sign-in page
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/auth/signup'); // Redirect to sign-up page
  };

  const handleGoogleSignIn = async () => {
    // Implement Google Sign-In logic here
    console.log("Signing in with Google");
  };

  const handleFacebookSignIn = async () => {
    // Implement Facebook Sign-In logic here
    console.log("Signing in with Facebook");
  };

  const toggleForm = () => {
    setShowSignIn(!showSignIn);
    setShowForgotPassword(false); // Reset forgot password state when toggling
  };

    const toggleForgotPassword = () => {
        setShowForgotPassword(!showForgotPassword);
        setShowSignIn(false); // Hide sign-in form when showing forgot password
    };

  return (
    <div className="flex items-center justify-center h-screen auth-page">
      <Card ref={cardRef} className="w-[450px] transition-transform duration-300">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">
            {showSignIn ? "Sign In" : showForgotPassword ? "Reset Password" : "Sign Up"}
          </CardTitle>
          <CardDescription>
            {showSignIn
              ? "Enter your email and password to sign in"
              : showForgotPassword
                ? "Enter your email to reset your password"
                : "Create an account to start your journey"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {showSignIn ? (
            <form onSubmit={handleSignIn} className="grid gap-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/80">
                  <Mail className="mr-2 h-4 w-4" />
                  Sign In with Email/Password
                </Button>
              <Button variant="link" onClick={toggleForgotPassword} className="button-link">
                Forgot your password?
              </Button>
            </form>
          ) : showForgotPassword ? (
            <form onSubmit={(e) => e.preventDefault()} className="grid gap-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/80">
                Reset Password
              </Button>
              <Button variant="link" onClick={() => setShowSignIn(true)} className="button-link">
                Back to Sign In
              </Button>
            </form>
          ) : (
            <div>
              <Button onClick={handleSignUp} className="button">Create Account</Button>
              <Button variant="link" onClick={toggleForm} className="button-link">
                Already have an account? Sign In
              </Button>
            </div>
          )}
          {!showForgotPassword && (
            <>
              <Button variant="outline" onClick={() => router.push('/auth/otp')} className="button">
                <Key className="mr-2 h-4 w-4" />
                Sign In with OTP
              </Button>
              <div className="flex justify-center gap-4 mt-4">
                <Button variant="secondary" onClick={handleGoogleSignIn} className="button">
                  <Mail className="mr-2 h-4 w-4" />
                  Sign In with Google
                </Button>
                <Button variant="secondary" onClick={handleFacebookSignIn} className="button">
                  <Facebook className="mr-2 h-4 w-4" />
                  Sign In with Facebook
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const Label = React.forwardRef<HTMLLabelElement, React.HTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 label",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"
