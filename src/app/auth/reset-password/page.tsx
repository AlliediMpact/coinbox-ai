'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Key, Loader2, CheckCircle2, XCircle } from 'lucide-react';

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

function ResetPasswordContent() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordRequirements, setPasswordRequirements] = useState<boolean[]>(
        new Array(PASSWORD_REQUIREMENTS.length).fill(false)
    );
    const { resetPassword } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const oobCode = searchParams.get('oobCode');

    useEffect(() => {
        if (!oobCode) {
            toast({
                title: "Invalid Reset Link",
                description: "Please use the link from your email to reset your password.",
                variant: "destructive",
            });
            router.push('/auth');
        }
    }, [oobCode, router, toast]);

    useEffect(() => {
        const newRequirements = PASSWORD_REQUIREMENTS.map(req => req.regex.test(newPassword));
        setPasswordRequirements(newRequirements);
    }, [newPassword]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!oobCode) {
            toast({
                title: "Invalid Reset Link",
                description: "Please use the link from your email to reset your password.",
                variant: "destructive",
            });
            return;
        }

        if (!passwordRequirements.every(req => req)) {
            toast({
                title: "Invalid Password",
                description: "Please meet all password requirements",
                variant: "destructive",
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: "Passwords Don't Match",
                description: "Please make sure your passwords match.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await resetPassword(oobCode, newPassword);
            toast({
                title: "Password Reset Successful",
                description: "You can now login with your new password.",
            });
            router.push('/auth');
        } catch (error: any) {
            toast({
                title: "Password Reset Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!oobCode) return null;

    return (
        <div className="flex items-center justify-center min-h-screen auth-page">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>Enter your new password below</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Enter new password"
                                    className="auth-input pl-10"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
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
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm new password"
                                    className="auth-input pl-10"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="auth-button w-full"
                            disabled={isSubmitting || !passwordRequirements.every(req => req)}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting Password...
                                </>
                            ) : (
                                "Reset Password"
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="auth-button-outline w-full"
                            onClick={() => router.push('/auth')}
                            disabled={isSubmitting}
                        >
                            Back to Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-[#193281]" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}