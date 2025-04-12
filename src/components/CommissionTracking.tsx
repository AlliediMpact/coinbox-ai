'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function CommissionTracking() {
    const [payoutStatus, setPayoutStatus] = useState('Pending');

    const handlePayout = () => {
        // Simulate the payout process
        setTimeout(() => {
            setPayoutStatus('Processing');
            setTimeout(() => {
                // Simulate success
                setPayoutStatus('Completed');
            }, 3000); // Simulate the duration of payout process
        }, 1000); // Simulate delay before starting payout
    };

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Commission Payout</CardTitle>
                <CardDescription className="text-gray-500">Withdraw your commission earnings.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <p>
                    <strong>Status:</strong> {payoutStatus}
                </p>
                {payoutStatus === 'Pending' && (
                     <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={handlePayout}>Request Payout</Button>
                         </TooltipTrigger>
                        <TooltipContent>
                          Click to request your payout
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                )}
                {payoutStatus === 'Processing' && (
                    <p>Payout in process...</p>
                )}
                {payoutStatus === 'Completed' && (
                    <p>Your payout has been successfully processed.</p>
                )}
            </CardContent>
        </Card>
    );
}
