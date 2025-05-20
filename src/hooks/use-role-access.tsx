'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface UseRoleAccessProps {
  requiredRole?: 'admin' | 'support' | 'user';
  redirectTo?: string;
  allowSupport?: boolean; // For admin sections that should be visible to support
}

export function useRoleAccess({
  requiredRole = 'user',
  redirectTo = '/',
  allowSupport = false
}: UseRoleAccessProps = {}) {
  const { user, userClaims, loading } = useAuth();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  
  useEffect(() => {
    if (!loading) {
      let hasRequiredRole = false;
      
      if (!user) {
        // User is not authenticated
        router.push(redirectTo);
        return;
      }
      
      if (requiredRole === 'admin') {
        // Admin access - check for admin role (or support if allowSupport is true)
        hasRequiredRole = 
          userClaims?.role === 'admin' || 
          (allowSupport && userClaims?.role === 'support');
      } else if (requiredRole === 'support') {
        // Support access - check for admin or support role
        hasRequiredRole = 
          userClaims?.role === 'admin' || 
          userClaims?.role === 'support';
      } else {
        // User access - any authenticated user has access
        hasRequiredRole = true;
      }
      
      if (!hasRequiredRole) {
        router.push(redirectTo);
      }
      
      setHasAccess(hasRequiredRole);
    }
  }, [user, userClaims, loading, requiredRole, redirectTo, router, allowSupport]);
  
  return { 
    hasAccess,
    isLoading: loading,
    role: userClaims?.role || 'user',
    isReadOnly: userClaims?.role === 'support' // Support role is read-only
  };
}
