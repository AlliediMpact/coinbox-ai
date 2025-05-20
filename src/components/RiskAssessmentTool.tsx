'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useEffect, useState} from "react";
import {getRiskAssessment} from "@/lib/risk-assessment";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { colors } from "@/styles/designTokens";

interface RiskAssessmentToolProps {
  userId: string;
  counterpartyId?: string;
}

export default function RiskAssessmentTool({ userId, counterpartyId }: RiskAssessmentToolProps) {
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | 'extreme' | null>(null);
  const [factors, setFactors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRiskAssessment = async () => {
      setLoading(true);
      setError(null);
      try {
        // Attempt to fetch the risk assessment
        const assessment = await getRiskAssessment({ 
          userId, 
          counterpartyId: counterpartyId || userId, // If no counterparty, use self analysis
          // Additional parameters will be fetched inside the risk assessment function
        });
        
        // If the assessment is successful, update the state with the results
        setRiskScore(assessment.riskScore);
        setRiskLevel(assessment.riskLevel);
        setFactors(assessment.factors);
      } catch (e: any) {
        // If there's an error during the assessment, log the error and update the state
        setError(e.message || "Failed to fetch risk assessment.");
        toast({
          title: "Error",
          description: e.message || "Failed to fetch risk assessment.",
          variant: "destructive",
        });
      } finally {
        // Delayed loading state for animation effect
        setTimeout(() => {
          setLoading(false);
        }, 600);
      }
    };

    // Call the fetchRiskAssessment function when the component mounts or the userId changes
    fetchRiskAssessment();
  }, [userId, counterpartyId, toast]);

  // Get color based on risk level
  const getRiskColor = () => {
    if (!riskLevel) return colors.status.info;
    
    switch (riskLevel) {
      case 'low':
        return colors.status.success;
      case 'medium':
        return colors.status.info;
      case 'high':
        return colors.status.warning;
      case 'extreme':
        return colors.status.error;
      default:
        return colors.status.info;
    }
  };
  
  // Create the gauge visualization for risk score
  const RiskGauge = ({ score }: { score: number }) => {
    // Calculate the angle for the gauge needle
    const angle = (score / 100) * 180; // 0-100 score maps to 0-180 degrees
    
    return (
      <motion.div className="w-full aspect-[2/1] relative">
        {/* Semi-circle background */}
        <div className="absolute inset-0 flex justify-center">
          <div className="h-full w-4/5 overflow-hidden">
            <div
              className="h-full w-full rounded-t-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
              style={{
                clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)"
              }}
            ></div>
          </div>
        </div>
        
        {/* Gauge marks */}
        <div className="absolute inset-0 flex justify-center">
          <div className="relative h-full w-4/5">
            {[0, 25, 50, 75, 100].map((mark) => (
              <div
                key={mark}
                className="absolute bottom-0 h-2 w-0.5 bg-white"
                style={{
                  left: `${mark}%`,
                  transform: "translateX(-50%)"
                }}
              ></div>
            ))}
            {[0, 25, 50, 75, 100].map((mark) => (
              <div
                key={`label-${mark}`}
                className="absolute bottom-0 text-[10px] font-medium text-white"
                style={{
                  left: `${mark}%`,
                  transform: "translate(-50%, -8px)"
                }}
              >
                {mark}
              </div>
            ))}
          </div>
        </div>
        
        {/* Center point and needle */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          {/* Center circle */}
          <div className="h-3 w-3 rounded-full bg-gray-800 z-10"></div>
          
          {/* Needle */}
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: angle }}
            transition={{ 
              type: "spring", 
              stiffness: 60,
              damping: 15,
              delay: 0.5
            }}
            className="absolute bottom-0 h-[calc(100%-6px)] w-1 origin-bottom bg-gray-800 rounded-t-full z-0"
            style={{
              transformOrigin: "bottom center"
            }}
          >
            <div className="absolute -top-1 -left-1 h-3 w-3 rounded-full bg-gray-800"></div>
          </motion.div>
        </div>
        
        {/* Risk level label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="absolute top-1 left-0 right-0 flex justify-center"
        >
          <span 
            className="px-3 py-1 text-xs font-bold rounded-full text-white"
            style={{ backgroundColor: getRiskColor() }}
          >
            {riskLevel?.toUpperCase()}
          </span>
        </motion.div>
      </motion.div>
    );
  };

  // Get icon based on risk level
  const getRiskIcon = () => {
    if (!riskLevel) return null;
    
    switch (riskLevel) {
      case 'low':
        return <CheckCircle className="mr-2 h-5 w-5 text-green-500" />;
      case 'medium':
        return <AlertCircle className="mr-2 h-5 w-5 text-blue-500" />;
      case 'high':
        return <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />;
      case 'extreme':
        return <AlertCircle className="mr-2 h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: getRiskColor() }}>
        <CardHeader>
          <CardTitle>Risk Assessment Tool</CardTitle>
          <CardDescription>AI-driven risk assessment based on transaction history.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center space-y-4 p-4"
              >
                <motion.div 
                  className="w-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Progress value={50} className="mb-2" />
                </motion.div>
                <motion.p 
                  animate={{ opacity: [0.5, 1, 0.5] }} 
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Processing risk factors...
                </motion.p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 p-4 rounded-md flex items-start space-x-2"
              >
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700">Assessment Error</p>
                  <p className="text-red-500">{error}</p>
                </div>
              </motion.div>
            ) : riskScore !== null && riskLevel !== null ? (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="space-y-6">
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.p 
                      className="font-semibold text-center mb-2"
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Risk Assessment Score
                    </motion.p>
                    
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <RiskGauge score={riskScore} />
                    </div>
                    
                    <div className="flex justify-center mt-2">
                      <motion.div
                        className="text-center font-bold text-2xl"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                          delay: 1.2,
                          type: "spring",
                          stiffness: 400,
                          damping: 10
                        }}
                      >
                        {riskScore}%
                      </motion.div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="font-semibold mb-2">Risk Factors:</p>
                    <div className="space-y-2">
                      {factors.length > 0 ? (
                        <motion.ul className="space-y-1">
                          {factors.map((factor, index) => (
                            <motion.li 
                              key={index}
                              className="flex items-center text-sm"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7 + (index * 0.1) }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></span>
                              {factor}
                            </motion.li>
                          ))}
                        </motion.ul>
                      ) : (
                        <p className="text-sm text-gray-500">No specific risk factors identified.</p>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="no-data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center p-4"
              >
                <p className="text-gray-500">No risk assessment available.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
