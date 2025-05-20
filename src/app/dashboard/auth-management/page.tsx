'use client';

import AdminAuthPanel from '@/components/AdminAuthPanel';
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AuthenticationManagementPage() {
  return (
    <RoleProtectedRoute requiredRole="admin" redirectTo="/dashboard" allowSupport={true}>
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
    </RoleProtectedRoute>
  );
}
