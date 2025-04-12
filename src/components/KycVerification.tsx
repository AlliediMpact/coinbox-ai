'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function KycVerification() {
    const [verificationStatus, setVerificationStatus] = useState('Not Verified');

    const handleVerification = () => {
        // Simulate the verification process
        setTimeout(() => {
            setVerificationStatus('Pending');
            setTimeout(() => {
                // Simulate success
                setVerificationStatus('Verified');
            }, 3000); // Simulate the duration of verification process
        }, 1000); // Simulate delay before starting verification
    };

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">KYC Verification</CardTitle>
                <CardDescription className="text-gray-500">Verify your identity for enhanced security.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <p>
                    <strong>Status:</strong> {verificationStatus}
                </p>
                {verificationStatus === 'Not Verified' && (
                     <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={handleVerification}>Verify Identity</Button>
                         </TooltipTrigger>
                        <TooltipContent>
                          Click to verify your identity
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                )}
                {verificationStatus === 'Pending' && (
                    <p>Verification in progress...</p>
                )}
                {verificationStatus === 'Verified' && (
                    <p>Your identity has been successfully verified.</p>
                )}
            </CardContent>
        </Card>
    );
}
