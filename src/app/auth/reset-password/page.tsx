'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

import AuthLayout from '@/components/auth/AuthLayout';
import { AnimatedInput } from '@/components/auth/AnimatedInput';
import AnimatedButton from '@/components/auth/AnimatedButton';
import AnimatedAlert from '@/components/auth/AnimatedAlert';
import PasswordStrength from '@/components/auth/PasswordStrength';

function ResetPasswordContent() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    
    const { resetPassword } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const oobCode = searchParams.get('oobCode');

    useEffect(() => {
        if (!oobCode) {
            setError("Invalid or expired reset link. Please request a new one.");
        }
    }, [oobCode]);

    const validatePassword = (password: string) => {
        if (!password) {
            setPasswordError('Password is required');
            return false;
        }
        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return false;
        }
        if (!/[A-Z]/.test(password)) {
            setPasswordError('Password must contain an uppercase letter');
            return false;
        }
        if (!/[a-z]/.test(password)) {
            setPasswordError('Password must contain a lowercase letter');
            return false;
        }
        if (!/[0-9]/.test(password)) {
            setPasswordError('Password must contain a number');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const validateConfirmPassword = (confirm: string) => {
        if (!confirm) {
            setConfirmPasswordError('Please confirm your password');
            return false;
        }
        if (confirm !== newPassword) {
            setConfirmPasswordError('Passwords do not match');
            return false;
        }
        setConfirmPasswordError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!oobCode) {
            setError("Invalid or expired reset link. Please request a new one.");
            return;
        }

        const isPasswordValid = validatePassword(newPassword);
        const isConfirmValid = validateConfirmPassword(confirmPassword);

        if (!isPasswordValid || !isConfirmValid) {
            return;
        }

        setIsSubmitting(true);

        try {
            await resetPassword(oobCode, newPassword);
            setSuccess(true);
            toast({
                title: "Password Reset Successful",
                description: "You can now login with your new password.",
            });
        } catch (error: any) {
            setError(error.message || 'Password reset failed. The link may have expired.');
            toast({
                title: "Password Reset Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!oobCode && !error) {
        return (
            <AuthLayout>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Reset Password"
            subtitle="Choose a new secure password for your account"
        >
            <AnimatePresence mode="wait">
                {!success ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <AnimatePresence mode="wait">
                                {error && (
                                    <AnimatedAlert type="error" message={error} />
                                )}
                            </AnimatePresence>

                            <AnimatedInput
                                label="New Password"
                                type="password"
                                placeholder="Create a strong password"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    if (confirmPassword) validateConfirmPassword(confirmPassword);
                                }}
                                onBlur={() => validatePassword(newPassword)}
                                error={passwordError}
                                showPasswordToggle
                                disabled={isSubmitting || !!error}
                                autoComplete="new-password"
                            />

                            <PasswordStrength password={newPassword} />

                            <AnimatedInput
                                label="Confirm Password"
                                type="password"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (e.target.value) validateConfirmPassword(e.target.value);
                                }}
                                onBlur={() => validateConfirmPassword(confirmPassword)}
                                error={confirmPasswordError}
                                success={confirmPassword && !confirmPasswordError ? 'Passwords match' : undefined}
                                showPasswordToggle
                                disabled={isSubmitting || !!error}
                                autoComplete="new-password"
                            />

                            <div className="space-y-3">
                                <AnimatedButton
                                    type="submit"
                                    loading={isSubmitting}
                                    loadingText="Resetting password..."
                                    disabled={
                                        !newPassword ||
                                        !confirmPassword ||
                                        !!passwordError ||
                                        !!confirmPasswordError ||
                                        isSubmitting ||
                                        !!error
                                    }
                                >
                                    Reset Password
                                </AnimatedButton>

                                <Link href="/auth/login">
                                    <AnimatedButton
                                        type="button"
                                        variant="outline"
                                        className="bg-white dark:bg-slate-800"
                                        disabled={isSubmitting}
                                    >
                                        Back to Sign In
                                    </AnimatedButton>
                                </Link>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center space-y-6 py-8"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto"
                        >
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </motion.div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Password Reset Complete!
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Your password has been successfully reset.
                            </p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Link href="/auth/login">
                                <AnimatedButton type="button">
                                    Sign In with New Password
                                </AnimatedButton>
                            </Link>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthLayout>
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