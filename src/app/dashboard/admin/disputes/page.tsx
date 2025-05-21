'use client';

import DisputeManagement from "@/components/admin/DisputeManagement";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLoading from "@/components/PageLoading";
import { hasAdminAccess } from "@/lib/auth-utils";

export default function DisputesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        const canAccess = await hasAdminAccess(user.uid, false); // Support users can access too
        setHasAccess(canAccess);
        
        if (!canAccess) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error checking admin access:", error);
        router.push('/dashboard');
      }
    };

    checkAccess();
  }, [user, router]);

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PageLoading message="Checking permissions" showTips={false} />
      </div>
    );
  }

  if (hasAccess === false) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Dispute Management</h1>
      <DisputeManagement />
    </div>
  );
}
