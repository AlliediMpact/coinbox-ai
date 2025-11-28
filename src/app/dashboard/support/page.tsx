'use client';

export const dynamic = 'force-dynamic';

import SupportComponent from "@/components/SupportComponent";
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute';

export default function SupportPage() {
  return (
    <RoleProtectedRoute requiredRole="support" redirectTo="/dashboard">
      <div className="support">
        <h1 className="text-2xl font-bold mb-4">Contact Support</h1>
        <SupportComponent />
      </div>
    </RoleProtectedRoute>
  );
}

