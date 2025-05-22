'use client';

import { useAuth } from '@/components/AuthProvider';
import SystemMonitoringDashboard from '@/components/system/SystemMonitoringDashboard';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

export default function SystemMonitoringPage() {
  const { user, userClaims } = useAuth();
  const isAdmin = userClaims?.role === 'admin';
  
  // Only admins can access the monitoring dashboard
  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the system monitoring dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <SystemMonitoringDashboard />
    </div>
  );
}
