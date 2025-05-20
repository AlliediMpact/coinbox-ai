'use client';

import { Loader2 } from 'lucide-react';
import { useRoleAccess } from '@/hooks/use-role-access';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'support' | 'user';
  redirectTo?: string;
  allowSupport?: boolean; // For admin sections that should be visible to support
}

export function RoleProtectedRoute({ 
  children, 
  requiredRole = 'user',
  redirectTo = '/',
  allowSupport = false
}: RoleProtectedRouteProps) {
  const { hasAccess, isLoading } = useRoleAccess({
    requiredRole,
    redirectTo,
    allowSupport
  });

  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#193281' }} />
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authorized (doesn't have the required role), don't render children
  if (!hasAccess) return null;

  // If authorized, render children
  return <>{children}</>;
}
