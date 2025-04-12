'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const referralData = [
  {id: 1, name: "John Doe", commission: "R50", tier: "Basic"},
  {id: 2, name: "Jane Smith", commission: "R75", tier: "Ambassador"},
  {id: 3, name: "Alice Johnson", commission: "R120", tier: "VIP"},
];

const commissionTiers = {
  "Basic": "3%",
  "Ambassador": "4%",
  "VIP": "5%",
};

export default function ReferralPage() {
    const [isPayoutRequested, setIsPayoutRequested] = useState(false);

    const totalCommission = referralData.reduce((sum, referral) => sum + Number(referral.commission.replace("R", "")), 0);

    const handleRequestPayout = () => {
        setIsPayoutRequested(true);
        // Simulate payout process - in a real app, this would trigger a backend process
        setTimeout(() => {
            alert('Payout processed successfully!');
            setIsPayoutRequested(false);
        }, 3000); // Simulate a 3 second payout processing time
    };

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Referral Tracking</CardTitle>
                <CardDescription className="text-gray-500">Track your referrals and commissions.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div>
                    <strong>Total Referrals:</strong> {referralData.length}
                </div>
                <div>
                    <strong>Total Commission:</strong> R{totalCommission}
                </div>
                <div>
                    <strong>Commission Payout Status:</strong> Automated - Next payout on 2024-08-01
                </div>
                <div>
                    <strong>Referral List:</strong>
                    <ul>
                        {referralData.map((referral) => (
                            <li key={referral.id} className="flex justify-between items-center">
                                <span>
                                    {referral.name} (Tier: {referral.tier})
                                </span>
                                <span>{referral.commission} ({commissionTiers[referral.tier as keyof typeof commissionTiers]})</span>
                            </li>
                        ))}
                    </ul>
                </div>
                {!isPayoutRequested ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={handleRequestPayout}>Withdraw Earnings</Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Click to withdraw your referral earnings
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <p>Processing payout...</p>
                )}
            </CardContent>
        </Card>
    );
}
