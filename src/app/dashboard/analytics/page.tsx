'use client';

import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { useAuth } from "@/components/AuthProvider";
import { hasAdminAccess } from "@/lib/auth-utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLoading from "@/components/PageLoading";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push('/auth');
        return;
      }
      
      try {
        const hasAccess = await hasAdminAccess(user.uid);
        setIsAuthorized(hasAccess);
        
        if (!hasAccess) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error checking access:", error);
        setIsAuthorized(false);
        router.push('/dashboard');
      }
    };
    
    checkAccess();
  }, [user, router]);
  
  if (isAuthorized === null) {
    return <PageLoading showAfterDelay={true} message="Checking permissions..." />;
  }
  
  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      <AnalyticsDashboard />
    </div>
  );
}
