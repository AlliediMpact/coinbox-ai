import { Loader2 } from 'lucide-react';
import { useAuthRequired } from '@/hooks/use-auth-required';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
  redirectTo?: string;
  verificationRedirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requireVerified = true,
  redirectTo = '/auth',
  verificationRedirectTo = '/auth/verify-email'
}: ProtectedRouteProps) {
  const { isAuthorized, isLoading } = useAuthRequired({
    requireVerified,
    redirectTo,
    verificationRedirectTo
  });

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

  if (!isAuthorized) return null;

  return <>{children}</>;
}
