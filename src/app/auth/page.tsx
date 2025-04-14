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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Checkbox } from "@/components/ui/checkbox"

// Define the Zod schema for form validation
const formSchema = z.object({
    fullName: z.string().min(2, {
        message: "Full Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    phone: z.string().min(10, {
        message: "Phone number must be at least 10 digits.",
    }),
    referralCode: z.string().optional(),
    password: z.string().min(8, {
        message: "Password must be at least 8 characters.",
    }),
    membershipTier: z.enum(['Basic', 'Ambassador', 'Business']).default('Basic'),
    terms: z.boolean().refine((value) => value === true, {
        message: "You must accept the terms and conditions.",
    }),
})


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
    const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for signup/signin

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            referralCode: "",
            password: "",
            membershipTier: "Basic",
            terms: false,
        },
    })


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
        setIsSubmitting(true);
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
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignUp = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            await signUp(values.email, values.password, {
                fullName: values.fullName,
                phone: values.phone,
                referralCode: values.referralCode,
                membershipTier: values.membershipTier,
            });
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
        } finally {
            setIsSubmitting(false);
        }
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
                            <Button
                                type="submit"
                                className="bg-primary text-primary-foreground hover:bg-primary/80"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Signing In..." : "Sign In with Email/Password"}
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
                        <form onSubmit={form.handleSubmit(handleSignUp)} className="grid gap-2">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    type="text"
                                    id="fullName"
                                    placeholder="Full Name"
                                    {...form.register("fullName")}
                                    required
                                />
                                {form.formState.errors.fullName && (
                                    <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Email"
                                    {...form.register("email")}
                                    required
                                />
                                {form.formState.errors.email && (
                                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    type="tel"
                                    id="phone"
                                    placeholder="Phone Number"
                                    {...form.register("phone")}
                                    required
                                />
                                {form.formState.errors.phone && (
                                    <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                                <Input
                                    type="text"
                                    id="referralCode"
                                    placeholder="Referral Code (Optional)"
                                    {...form.register("referralCode")}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    type="password"
                                    id="password"
                                    placeholder="Password"
                                    {...form.register("password")}
                                    required
                                />
                                {form.formState.errors.password && (
                                    <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                                )}
                            </div>
                            {/* Membership Tier Selection */}
                            <Select onValueChange={form.setValue("membershipTier")}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Membership Tier" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Basic">Basic</SelectItem>
                                    <SelectItem value="Ambassador">Ambassador</SelectItem>
                                    <SelectItem value="Business">Business</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="grid gap-2">
                                <Label htmlFor="terms" className="flex items-center space-x-2">
                                    <Checkbox
                                        id="terms"
                                        {...form.register("terms")}
                                    />
                                    <span>I agree to the <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a></span>
                                </Label>
                                {form.formState.errors.terms && (
                                    <p className="text-sm text-red-500">{form.formState.errors.terms.message}</p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                className="bg-primary text-primary-foreground hover:bg-primary/80"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Creating Account..." : "Create Account"}
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
