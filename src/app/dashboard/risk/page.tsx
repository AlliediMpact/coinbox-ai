'use client';

export const dynamic = 'force-dynamic';

import RiskAssessmentTool from "@/components/RiskAssessmentTool";
import { useAuth } from '@/components/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function RiskPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="risk">
        <h1 className="text-2xl font-bold mb-4">Risk Assessment Tool</h1>
        <RiskAssessmentTool userId={user?.uid || 'default'} />
      </div>
    </ProtectedRoute>
  );
}

