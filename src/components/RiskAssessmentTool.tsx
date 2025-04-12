'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useEffect, useState} from "react";
import {getRiskAssessment} from "@/ai/flows/risk-assessment-flow";
import { useToast } from "@/hooks/use-toast"; // Import the useToast hook

interface RiskAssessmentToolProps {
  userId: string;
}

export default function RiskAssessmentTool({ userId }: RiskAssessmentToolProps) {
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast(); // Initialize the useToast hook

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
        toast({
          title: "Error",
          description: e.message || "Failed to fetch risk assessment.",
          variant: "destructive", // Use the "destructive" variant for error messages
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRiskAssessment();
  }, [userId, toast]);

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
        ) : riskScore !== null && explanation !== null ? (
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
