'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

type UseAuthRequiredOptions = {
  /**
   * If true, the user must have a verified email to access the protected route
   */
  requireVerified?: boolean;
  
  /**
   * The URL to redirect to if the user is not authenticated
   */
  redirectTo?: string;
  
  /**
   * The URL to redirect to if the user's email is not verified
   */
  verificationRedirectTo?: string;
};

/**
 * A hook to protect routes by requiring authentication.
 * Redirects unauthenticated users to the login page.
 * Can also require email verification.
 */
export function useAuthRequired({
  requireVerified = true,
  redirectTo = '/auth',
  verificationRedirectTo = '/auth/verify-email'
}: UseAuthRequiredOptions = {}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Store the current path for redirecting back after login
  useEffect(() => {
    if (!user && pathname !== redirectTo && pathname !== verificationRedirectTo) {
      // Save the current path for redirecting back after login
      sessionStorage.setItem('redirectAfterAuth', pathname);
    }
  }, [pathname, redirectTo, verificationRedirectTo, user]);
  
  useEffect(() => {
    // Wait for the auth state to load before making any decisions
    if (loading) return;
    
    // If no user is logged in, redirect to login page
    if (!user) {
      router.push(redirectTo);
      return;
    }
    
    // If verification is required but the user's email isn't verified
    if (requireVerified && !user.emailVerified) {
      router.push(verificationRedirectTo);
      return;
    }
    
    // User is authenticated and verified if required
    setIsAuthorized(true);
  }, [user, loading, requireVerified, router, redirectTo, verificationRedirectTo]);
  
  return {
    isAuthorized,
    isLoading: loading,
    user
  };
}

/**
 * A hook that redirects authenticated users away from auth pages.
 * Used for login, signup, etc. pages where authenticated users shouldn't be.
 */
export function useRedirectIfAuthenticated(redirectTo = '/dashboard') {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Wait for the auth state to load
    if (loading) return;
    
    // If user is authenticated, redirect to specified page
    if (user) {
      // Check if there's a saved redirect path after login
      const redirectPath = sessionStorage.getItem('redirectAfterAuth');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterAuth');
        router.push(redirectPath);
      } else {
        router.push(redirectTo);
      }
    }
  }, [user, loading, router, redirectTo]);
  
  return { isLoading: loading };
}
