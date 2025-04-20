'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from 'react';
import { Mail, Key, User, Phone, Gift, Shield } from 'lucide-react';
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
    const { signUp, signIn, initiateSignUp, sendPasswordResetLink } = useAuth();
    const { toast } = useToast();

    // Sign In form state
    const [signInEmail, setSignInEmail] = useState('');
    const [signInPassword, setSignInPassword] = useState('');

    // Add password visibility toggle state
    const [showPassword, setShowPassword] = useState(false);
    const [showSignUpPassword, setShowSignUpPassword] = useState(false);

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
            toast({
                title: "Sign In Successful",
                description: "Welcome back!",
            });
            router.push('/dashboard');
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
            toast({
                title: "Redirecting to Payment",
                description: "Please complete your payment to activate your account.",
            });
        } catch (error: any) {
            toast({
                title: "Sign Up Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await sendPasswordResetLink(signInEmail);
            toast({
                title: "Password Reset Email Sent",
                description: "Check your inbox for reset instructions.",
            });
            setShowForgotPassword(false);
        } catch (error: any) {
            toast({
                title: "Reset Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Session expiry feedback (listen for session expiry in localStorage)
    useState(() => {
        if (typeof window !== "undefined") {
            const onStorage = (e: StorageEvent) => {
                if (e.key === "auth_session" && !e.newValue) {
                    toast({
                        title: "Session Expired",
                        description: "Your session has expired. Please sign in again.",
                        variant: "destructive",
                    });
                    router.push("/auth");
                }
            };
            window.addEventListener("storage", onStorage);
            return () => window.removeEventListener("storage", onStorage);
        }
    }, []);

    // Responsive and flipping logic fixes
    // Use a single card with conditional rendering instead of flipping faces
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f4f6fa] px-2">
            <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center py-12">
                {/* Welcome message at the top */}
                <div className="w-full mb-6 animate-fade-in-down">
                    <h2 className={cn(
                        "text-3xl font-extrabold mb-2 tracking-tight text-center",
                        isFlipped ? "text-[#193281]" : "text-[#5e17eb]"
                    )}>
                        {isFlipped ? "Create your account" : "Sign in to CoinBox"}
                    </h2>
                    <p className="mb-4 text-gray-700 text-lg text-center">
                        {isFlipped
                            ? "Get started with your secure digital finance journey."
                            : "Welcome back! Please sign in to continue."}
                    </p>
                </div>
                <div className="w-full">
                    <div className="bg-white border border-[#e3e6ef] rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col gap-6 transition-all duration-500 relative animate-fade-in-up">
                        {isFlipped ? (
                            <form
                                onSubmit={form.handleSubmit(handleSignUp)}
                                className="space-y-5 w-full"
                                aria-label="Sign up form"
                                autoComplete="on"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        placeholder="Enter your full name"
                                        className="block w-full rounded-lg border border-[#e3e6ef] bg-[#f4f6fa] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#5e17eb] transition"
                                        {...form.register("fullName")}
                                        aria-required="true"
                                    />
                                    {form.formState.errors.fullName && (
                                        <p className="text-red-400 text-xs mt-1">{form.formState.errors.fullName.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signUpEmail">Email</Label>
                                    <input
                                        id="signUpEmail"
                                        type="email"
                                        placeholder="Enter your email"
                                        className="block w-full rounded-lg border border-[#e3e6ef] bg-[#f4f6fa] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#5e17eb] transition"
                                        {...form.register("email")}
                                        aria-required="true"
                                    />
                                    {form.formState.errors.email && (
                                        <p className="text-red-400 text-xs mt-1">{form.formState.errors.email.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        placeholder="Enter your phone number"
                                        className="block w-full rounded-lg border border-[#e3e6ef] bg-[#f4f6fa] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#5e17eb] transition"
                                        {...form.register("phone")}
                                        aria-required="true"
                                    />
                                    {form.formState.errors.phone && (
                                        <p className="text-red-400 text-xs mt-1">{form.formState.errors.phone.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                                    <input
                                        id="referralCode"
                                        type="text"
                                        placeholder="Enter referral code"
                                        className="block w-full rounded-lg border border-[#e3e6ef] bg-[#f4f6fa] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#5e17eb] transition"
                                        {...form.register("referralCode")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="membershipTier">Membership Tier</Label>
                                    <Select 
                                        onValueChange={(value) => form.setValue("membershipTier", value as "Basic" | "Ambassador" | "Business")}
                                        defaultValue={form.getValues("membershipTier")}
                                    >
                                        <SelectTrigger className="block w-full rounded-lg border border-[#e3e6ef] bg-[#f4f6fa] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#5e17eb] transition">
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
                                        <input
                                            id="password"
                                            type={showSignUpPassword ? "text" : "password"}
                                            placeholder="Create a password"
                                            className="block w-full rounded-lg border border-[#e3e6ef] bg-[#f4f6fa] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#5e17eb] transition pr-10"
                                            {...form.register("password")}
                                            aria-required="true"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5e17eb] focus:outline-none"
                                            onClick={() => setShowSignUpPassword(v => !v)}
                                            aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                                        >
                                            {showSignUpPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.234.938-4.675M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.062-4.675A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.675-.938" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.21 2.21a9.956 9.956 0 002.79-2.21c-1.657-2.657-4.477-4.5-8-4.5s-6.343 1.843-8 4.5a9.956 9.956 0 002.79 2.21" /></svg>
                                            )}
                                        </button>
                                    </div>
                                    {form.formState.errors.password && (
                                        <p className="text-red-400 text-xs mt-1">{form.formState.errors.password.message}</p>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="terms" 
                                        onCheckedChange={(checked) => 
                                            form.setValue("terms", checked as boolean)
                                        }
                                        aria-checked={form.watch("terms")}
                                    />
                                    <label
                                        htmlFor="terms"
                                        className="text-sm text-gray-700"
                                    >
                                        I agree to the <a href="/terms" className="underline text-[#193281] hover:text-[#5e17eb]">Terms and Conditions</a>
                                    </label>
                                </div>
                                {form.formState.errors.terms && (
                                    <p className="text-red-400 text-sm">{form.formState.errors.terms.message}</p>
                                )}
                                <Button
                                    type="submit"
                                    className="auth-button w-full bg-[#193281] hover:bg-[#5e17eb] text-white font-bold shadow-md transition-all duration-200 py-3 rounded-lg"
                                    disabled={isSubmitting}
                                    aria-busy={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin rounded-full border-2 border-white border-t-transparent h-4 w-4" />
                                            Creating Account...
                                        </span>
                                    ) : "Sign Up"}
                                </Button>
                                <div className="flex items-center justify-center mt-2">
                                    <button
                                        type="button"
                                        className="text-sm text-[#193281]/80 hover:text-[#5e17eb] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#193281]"
                                        onClick={() => setIsFlipped(false)}
                                        tabIndex={0}
                                    >
                                        Already have an account? Sign In
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form
                                onSubmit={handleSignIn}
                                className="space-y-5 w-full"
                                aria-label="Sign in form"
                                autoComplete="on"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        className="block w-full rounded-lg border border-[#e3e6ef] bg-[#f4f6fa] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#193281] transition"
                                        value={signInEmail}
                                        onChange={(e) => setSignInEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        aria-required="true"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            className="block w-full rounded-lg border border-[#e3e6ef] bg-[#f4f6fa] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#193281] transition pr-10"
                                            value={signInPassword}
                                            onChange={(e) => setSignInPassword(e.target.value)}
                                            required
                                            autoComplete="current-password"
                                            aria-required="true"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#193281] focus:outline-none"
                                            onClick={() => setShowPassword(v => !v)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.234.938-4.675M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.062-4.675A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.675-.938" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.21 2.21a9.956 9.956 0 002.79-2.21c-1.657-2.657-4.477-4.5-8-4.5s-6.343 1.843-8 4.5a9.956 9.956 0 002.79 2.21" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="auth-button w-full bg-[#193281] hover:bg-[#5e17eb] text-white font-bold shadow-md transition-all duration-200 py-3 rounded-lg"
                                    disabled={isSubmitting}
                                    aria-busy={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin rounded-full border-2 border-white border-t-transparent h-4 w-4" />
                                            Signing in...
                                        </span>
                                    ) : "Sign In"}
                                </Button>
                                <div className="flex flex-col sm:flex-row items-center justify-between mt-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-sm text-[#193281]/80 hover:text-[#5e17eb] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#193281]"
                                        tabIndex={0}
                                    >
                                        Forgot your password?
                                    </button>
                                    <button
                                        type="button"
                                        className="text-sm text-[#5e17eb]/80 hover:text-[#193281] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5e17eb]"
                                        onClick={() => setIsFlipped(true)}
                                        tabIndex={0}
                                    >
                                        Create account
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
                {/* Welcome message for larger screens */}
                <div className="hidden md:block mt-8 text-center">
                    <h2 className={cn(
                        "text-3xl font-extrabold mb-2 tracking-tight",
                        isFlipped ? "text-[#193281]" : "text-[#5e17eb]"
                    )}>
                        {isFlipped ? "Welcome Back!" : "Hello, Friend!"}
                    </h2>
                    <p className="mb-4 text-gray-700 text-lg">
                        {isFlipped
                            ? "To keep connected with us please login with your personal info"
                            : "Enter your personal details and start your journey with us."}
                    </p>
                </div>
            </div>
            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white border border-[#e3e6ef] rounded-2xl shadow-xl p-8 w-full max-w-md animate-fade-in-up">
                        <div className="mb-6">
                            <h2 className="text-2xl font-extrabold mb-2 tracking-tight text-center text-[#193281]">Reset Password</h2>
                            <p className="mb-2 text-gray-700 text-center text-base">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                        </div>
                        <form onSubmit={handleForgotPassword} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="resetEmail">Email</Label>
                                <input
                                    id="resetEmail"
                                    type="email"
                                    placeholder="Enter your email"
                                    className="block w-full rounded-lg border border-[#e3e6ef] bg-[#f4f6fa] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#193281] transition"
                                    value={signInEmail}
                                    onChange={(e) => setSignInEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-[#193281] hover:bg-[#5e17eb] text-white font-bold py-3 rounded-lg shadow-md transition-all duration-200"
                                disabled={isSubmitting}
                                aria-busy={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin rounded-full border-2 border-white border-t-transparent h-4 w-4" />
                                        Sending...
                                    </span>
                                ) : "Send Reset Link"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full mt-2 text-[#193281] hover:text-[#5e17eb] font-semibold"
                                onClick={() => setShowForgotPassword(false)}
                            >
                                Cancel
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Animation styles (add to your global CSS or Tailwind config)
// .animate-fade-in-down { animation: fadeInDown 0.5s both; }
// .animate-fade-in-up { animation: fadeInUp 0.5s both; }
// @keyframes fadeInDown { from { opacity: 0; transform: translateY(-24px);} to { opacity: 1; transform: none;} }
// @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px);} to { opacity: 1; transform: none;} }
