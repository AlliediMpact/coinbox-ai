'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useEffect, useState} from "react";
import {getRiskAssessment} from "@/ai/flows/risk-assessment-flow";

interface RiskAssessmentToolProps {
  userId: string;
}

export default function RiskAssessmentTool({ userId }: RiskAssessmentToolProps) {
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiskAssessment = async () => {
      setLoading(true);
      setError(null);
      try {
        const assessment = await getRiskAssessment({ userId: userId });
        setRiskScore(assessment.riskScore);
        setExplanation(assessment.explanation);
      } catch (e: any) {
        setError(e.message || "Failed to fetch risk assessment.");
      } finally {
        setLoading(false);
      }
    };

    fetchRiskAssessment();
  }, [userId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Assessment Tool</CardTitle>
        <CardDescription>AI-driven risk assessment based on transaction history.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {loading ? (
          <div>Loading risk assessment...</div>
        ) : error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : riskScore !== null ? (
          <>
            <div>
              <strong>Risk Score:</strong> {riskScore}
            </div>
            <div>
              <strong>Explanation:</strong> {explanation}
            </div>
          </>
        ) : (
          <div>No risk assessment available.</div>
        )}
      </CardContent>
    </Card>
  );
}
