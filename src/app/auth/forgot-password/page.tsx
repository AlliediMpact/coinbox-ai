'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

import AuthLayout from '@/components/auth/AuthLayout';
import { AnimatedInput } from '@/components/auth/AnimatedInput';
import AnimatedButton from '@/components/auth/AnimatedButton';
import AnimatedAlert from '@/components/auth/AnimatedAlert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { sendPasswordReset } = useAuth();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      return;
    }

    setIsSubmitting(true);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
      toast({
        title: "Reset Link Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link. Please try again.');
      toast({
        title: "Error",
        description: err.message || 'Failed to send reset link.',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your email to receive a password reset link"
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
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (e.target.value) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(email)}
                error={emailError}
                disabled={isSubmitting}
                autoComplete="email"
              />

              <AnimatedButton
                type="submit"
                loading={isSubmitting}
                loadingText="Sending..."
                disabled={!email || !!emailError || isSubmitting}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Reset Link
              </AnimatedButton>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </motion.div>
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
                Check Your Email
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                We've sent a password reset link to:
              </p>
              <p className="font-semibold text-blue-600 dark:text-blue-400">
                {email}
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-slate-700 dark:text-slate-300"
            >
              <p>
                Click the link in your email to reset your password. The link will expire in 1 hour.
              </p>
            </motion.div>

            <div className="space-y-3">
              <AnimatedButton
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
              >
                Send Another Link
              </AnimatedButton>

              <Link href="/auth/login">
                <AnimatedButton
                  type="button"
                  variant="outline"
                  className="bg-white dark:bg-slate-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </AnimatedButton>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
