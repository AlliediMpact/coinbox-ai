'use client';

import { useEffect, useState } from 'react';
import TransactionMonitoring from '@/components/admin/TransactionMonitoring';
import { useAuth } from '@/components/AuthProvider';
import PageLoading from '@/components/PageLoading';
import { Button } from '@/components/ui/button';

export default function AdminTransactionMonitoringPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Check if user has admin role
    const checkAdmin = async () => {
      try {
        const token = await user.getIdTokenResult();
        const hasAdminRole = token.claims?.roles?.includes('admin') || false;
        setIsAdmin(hasAdminRole);
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

  if (loading) {
    return <PageLoading message="Checking permissions..." />;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">You don&apos;t have permission to access this page.</p>
        <Button asChild>
          <a href="/dashboard">Return to Dashboard</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="admin-transaction-monitoring">
      <h1 className="text-2xl font-bold mb-6">Transaction Monitoring</h1>
      <TransactionMonitoring />
    </div>
  );
}
