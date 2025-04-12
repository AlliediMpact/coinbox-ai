'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from 'react';
import { Mail, Key } from 'lucide-react'; // Import icons
import { cn } from "@/lib/utils";
import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider'; // Import useAuth
import { useToast } from "@/hooks/use-toast"; // Import the useToast hook
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


export default function AuthPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [showSignIn, setShowSignIn] = useState(true);
    const [showForgotPassword, setShowForgotPassword] = useState(false); // State for forgot password
    const cardRef = useRef<HTMLDivElement>(null); // Ref for the card element
    const [membershipTier, setMembershipTier] = useState('Basic'); // Default value
    const { signUp, signIn } = useAuth();
    const { toast } = useToast(); // Initialize the useToast hook
    const [open, setOpen] = useState(false); // Dialog for password reset

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
        try {
            await signIn(email, password);
            router.push('/dashboard'); // Redirect to dashboard after successful sign in
            toast({
                title: "Sign In Successful",
                description: `Welcome back, ${email}!`,
            });
        } catch (error: any) {
            console.error("Failed to sign in:", error.message);
            toast({
                title: "Sign In Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signUp(email, password, { fullName, phone, referralCode, membershipTier });
            router.push('/dashboard'); // Redirect to dashboard after successful sign up
            toast({
                title: "Sign Up Successful",
                description: "Account created successfully! Redirecting to dashboard...",
            });
        } catch (error: any) {
            console.error("Failed to sign up:", error.message);
            toast({
                title: "Sign Up Error",
                description: error.message,
                variant: "destructive",
            });
        }
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
                            <Button variant="link" onClick={() => {
                                toggleForgotPassword();
                                setOpen(true); // Open the dialog
                            }} className="button-link">
                                Forgot your password?
                            </Button>
                            <Button variant="link" onClick={toggleForm} className="button-link">
                                Create an account? Sign Up
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
                        <form onSubmit={handleSignUp} className="grid gap-2">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    type="text"
                                    id="fullName"
                                    placeholder="Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
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
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    type="tel"
                                    id="phone"
                                    placeholder="Phone Number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                                <Input
                                    type="text"
                                    id="referralCode"
                                    placeholder="Referral Code (Optional)"
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    type="password"
                                    id="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {/* Membership Tier Selection */}
                            <Select onValueChange={(value) => setMembershipTier(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Membership Tier" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Basic">Basic</SelectItem>
                                    <SelectItem value="Ambassador">Ambassador</SelectItem>
                                    <SelectItem value="Business">Business</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/80">
                                Create Account
                            </Button>
                            <Button variant="link" onClick={toggleForm} className="button-link">
                                Already have an account? Sign In
                            </Button>
                        </form>
                    )}
                    {!showForgotPassword && (
                        <>
                            <Button variant="outline" onClick={() => router.push('/auth/otp')} className="button">
                                <Key className="mr-2 h-4 w-4" />
                                Sign In with OTP
                            </Button>
                            <div className="flex justify-center gap-4 mt-4">
                                <Button variant="secondary" onClick={handleGoogleSignIn} className="button">
                                    {/* Google Icon as Inline SVG */}
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M19.6758 8.78049C19.7133 9.46341 19.7133 10.1463 19.6758 10.8293C18.7805 16.2317 14.4146 19.9999 9.99987 19.9999C4.47703 19.9999 0 15.5228 0 9.9999C0 4.47706 4.47703 0 9.99987 0C12.7381 0 15.1452 1.14927 16.8403 2.84437L13.8658 5.81883C12.861 4.81395 11.5244 4.16342 9.99987 4.16342C6.77654 4.16342 4.16341 6.77655 4.16341 9.9999C4.16341 13.2232 6.77654 15.8363 9.99987 15.8363C12.2171 15.8363 13.6988 14.6997 14.078 13.2649H9.99987V9.9999H16.8769C17.0974 10.6668 17.2293 11.3741 17.2293 12.1219C17.2293 13.7451 16.366 15.0335 14.9755 15.9412C16.3121 17.5317 18.407 18.678 19.6758 18.7155C19.6758 17.9943 19.6758 17.2732 19.6758 16.5521C19.6758 15.1219 19.6758 13.6917 19.6758 12.2615C19.6758 11.9208 19.6758 11.5801 19.6758 11.2393C19.6758 10.9366 19.6758 10.634 19.6758 10.3313C19.6758 9.09756 19.6758 7.86382 19.6758 6.62996C19.6758 6.62996 19.6758 7.97305 19.6758 8.78049Z"/>
                                    </svg>
                                    Sign In with Google
                                </Button>
                                <Button variant="secondary" onClick={handleFacebookSignIn} className="button">
                                    {/* Facebook Icon as Inline SVG */}
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.7063 4.03125H14.0625V0H11.7063C8.8625 0 6.71875 2.14375 6.71875 4.9875V7.34375H4.3625V10H6.71875V19.9688H11.7063V10H14.0625L14.8438 7.34375H11.7063V4.03125Z"/>
                                    </svg>
                                    Sign In with Facebook
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Enter your email to reset your password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
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
                    </div>
                    <div className="flex justify-end space-x-2">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/80">
                            Reset Password
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
