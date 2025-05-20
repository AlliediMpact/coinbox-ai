'use client';

import AdminAuthPanel from '@/components/AdminAuthPanel';
import { useAuth } from '@/components/AuthProvider';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AuthenticationManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    
    // Check if user is admin, if not redirect to dashboard
    if (user && user.email !== 'admin@example.com') {
      router.push('/dashboard');
    }
    
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);
  
  if (!isMounted) return <div>Loading...</div>;
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Authentication Management</CardTitle>
          <CardDescription>
            Manage user authentication, review security events, and monitor authentication activity
          </CardDescription>
        </CardHeader>
      </Card>
      
      <AdminAuthPanel />
    </div>
  );
}
