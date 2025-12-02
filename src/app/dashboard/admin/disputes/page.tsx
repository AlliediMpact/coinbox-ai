'use client';

import DisputeManagement from "@/components/admin/DisputeManagement";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";

export default function DisputesPage() {
  return (
    <RoleProtectedRoute allowedRoles={['admin', 'support']}>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Dispute Management</h1>
        <DisputeManagement />
      </div>
    </RoleProtectedRoute>
  );
}
