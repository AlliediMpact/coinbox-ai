'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from 'react';
import { Mail, Key, User, Phone, Gift } from 'lucide-react';
import { cn } from "@/lib/utils";
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
    fullName: z.string().min(2, { message: "Full Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
    referralCode: z.string().optional(),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    membershipTier: z.enum(['Basic', 'Ambassador', 'Business']).default('Basic'),
    terms: z.boolean().refine((value) => value === true, {
        message: "You must accept the terms and conditions.",
    }),
});

export default function AuthPage() {
    const router = useRouter();
    const [isFlipped, setIsFlipped] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { signUp, signIn, initiateSignUp } = useAuth();
    const { toast } = useToast();

    // Sign In form state
    const [signInEmail, setSignInEmail] = useState('');
    const [signInPassword, setSignInPassword] = useState('');

    // Sign Up form handling
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
    });

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await signIn(signInEmail, signInPassword);
            router.push('/dashboard');
            toast({
                title: "Sign In Successful",
                description: "Welcome back!",
            });
        } catch (error: any) {
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
            await initiateSignUp(values.email, values.password, {
                fullName: values.fullName,
                phone: values.phone,
                referralCode: values.referralCode,
                membershipTier: values.membershipTier,
            });
            // Note: No need for redirect here as initiateSignUp will handle the redirect to Paystack
            toast({
                title: "Redirecting to Payment",
                description: "Please complete your payment to activate your account.",
            });
        } catch (error: any) {
            console.error("Failed to initiate signup:", error.message);
            toast({
                title: "Sign Up Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen auth-page">
            <div className="auth-container py-8">
                <div className={cn("auth-card", isFlipped && "flipped")}>
                    {/* Front face - Sign In */}
                    <div className="auth-card-face auth-card-front">
                        <div className="flex w-full h-full">
                            {/* Left side - Sign in form */}
                            <div className="flex-1 flex items-center justify-center">
                                <div className="auth-form">
                                    <h2 className="text-2xl font-bold mb-6">Sign In</h2>
                                    <form onSubmit={handleSignIn} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    className="auth-input pl-10"
                                                    value={signInEmail}
                                                    onChange={(e) => setSignInEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    placeholder="Enter your password"
                                                    className="auth-input pl-10"
                                                    value={signInPassword}
                                                    onChange={(e) => setSignInPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            type="submit"
                                            className="auth-button w-full"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? "Signing in..." : "Sign In"}
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="text-sm text-white/80 hover:text-white"
                                        >
                                            Forgot your password?
                                        </button>
                                    </form>
                                </div>
                            </div>
                            {/* Right side - Welcome message */}
                            <div className="flex-1 flex items-center justify-center bg-white/10 rounded-r-lg">
                                <div className="auth-welcome">
                                    <h2>Hello, Friend!</h2>
                                    <p>Enter your personal details and start your journey with us.</p>
                                    <Button
                                        className="auth-button-outline"
                                        onClick={() => setIsFlipped(true)}
                                    >
                                        Sign Up
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Back face - Sign Up */}
                    <div className="auth-card-face auth-card-back">
                        <div className="flex w-full h-full">
                            {/* Left side - Welcome back */}
                            <div className="flex-1 flex items-center justify-center bg-white/10 rounded-l-lg">
                                <div className="auth-welcome">
                                    <h2>Welcome Back!</h2>
                                    <p>To keep connected with us please login with your personal info</p>
                                    <Button
                                        className="auth-button-outline"
                                        onClick={() => setIsFlipped(false)}
                                    >
                                        Sign In
                                    </Button>
                                </div>
                            </div>
                            {/* Right side - Sign up form */}
                            <div className="flex-1 flex items-center justify-center">
                                <div className="auth-form">
                                    <h2 className="text-2xl font-bold mb-6">Create Account</h2>
                                    <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Full Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                                                <Input
                                                    id="fullName"
                                                    placeholder="Enter your full name"
                                                    className="auth-input pl-10"
                                                    {...form.register("fullName")}
                                                />
                                            </div>
                                            {form.formState.errors.fullName && (
                                                <p className="text-red-400 text-sm">{form.formState.errors.fullName.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signUpEmail">Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                                                <Input
                                                    id="signUpEmail"
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    className="auth-input pl-10"
                                                    {...form.register("email")}
                                                />
                                            </div>
                                            {form.formState.errors.email && (
                                                <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                                                <Input
                                                    id="phone"
                                                    placeholder="Enter your phone number"
                                                    className="auth-input pl-10"
                                                    {...form.register("phone")}
                                                />
                                            </div>
                                            {form.formState.errors.phone && (
                                                <p className="text-red-400 text-sm">{form.formState.errors.phone.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                                            <div className="relative">
                                                <Gift className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                                                <Input
                                                    id="referralCode"
                                                    placeholder="Enter referral code"
                                                    className="auth-input pl-10"
                                                    {...form.register("referralCode")}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="membershipTier">Membership Tier</Label>
                                            <Select 
                                                onValueChange={(value) => form.setValue("membershipTier", value as "Basic" | "Ambassador" | "Business")}
                                                defaultValue={form.getValues("membershipTier")}
                                            >
                                                <SelectTrigger className="auth-input">
                                                    <SelectValue placeholder="Select a membership tier" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Basic">Basic (R550)</SelectItem>
                                                    <SelectItem value="Ambassador">Ambassador (R1,100)</SelectItem>
                                                    <SelectItem value="Business">Business (R11,000)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    placeholder="Create a password"
                                                    className="auth-input pl-10"
                                                    {...form.register("password")}
                                                />
                                            </div>
                                            {form.formState.errors.password && (
                                                <p className="text-red-400 text-sm">{form.formState.errors.password.message}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id="terms" 
                                                onCheckedChange={(checked) => 
                                                    form.setValue("terms", checked as boolean)
                                                }
                                            />
                                            <label
                                                htmlFor="terms"
                                                className="text-sm text-white/80"
                                            >
                                                I agree to the Terms and Conditions
                                            </label>
                                        </div>
                                        {form.formState.errors.terms && (
                                            <p className="text-red-400 text-sm">{form.formState.errors.terms.message}</p>
                                        )}
                                        <Button
                                            type="submit"
                                            className="auth-button w-full"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? "Creating Account..." : "Sign Up"}
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
