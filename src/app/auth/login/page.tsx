'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from '@/components/auth/AuthLayout';
import { AnimatedInput } from '@/components/auth/AnimatedInput';
import AnimatedButton from '@/components/auth/AnimatedButton';
import AnimatedAlert from '@/components/auth/AnimatedAlert';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [shake, setShake] = useState(false);

  const { signIn, loading: authLoading } = useAuth();
  const router = useRouter();

  // Validate email
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

  // Validate password
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(email, password);
      
      // Success animation before redirect
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form is valid
  const isFormValid = email && password && !emailError && !passwordError;

  // Show loading state if auth is still initializing
  if (authLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="text-slate-600 dark:text-slate-400">Initializing authentication...</p>
          </motion.div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue"
    >
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6"
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
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

        <AnimatedInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (e.target.value) validatePassword(e.target.value);
          }}
          onBlur={() => validatePassword(password)}
          error={passwordError}
          showPasswordToggle
          disabled={isSubmitting}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-sm">
          <Link
            href="/auth/reset-password"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <AnimatedButton
          type="submit"
          loading={isSubmitting}
          loadingText="Signing in..."
          disabled={!isFormValid || isSubmitting}
        >
          Sign In
        </AnimatedButton>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-sm text-slate-600 dark:text-slate-400"
        >
          Don't have an account?{' '}
          <Link
            href="/auth/signup"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
          >
            Sign up
          </Link>
        </motion.div>
      </motion.form>
    </AuthLayout>
  );
}