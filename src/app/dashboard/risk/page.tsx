'use client';

import RiskAssessmentTool from "@/components/RiskAssessmentTool";
import { useAuth } from '@/components/AuthProvider';

export default function RiskPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Risk Assessment Tool</h1>
      <RiskAssessmentTool userId={user?.uid || 'default'} />
    </div>
  );
}
