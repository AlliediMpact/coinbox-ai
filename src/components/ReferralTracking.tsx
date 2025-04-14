'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Mock referral data
const referralData = [
  {id: 1, name: "John Doe", referredTier: "Basic"},
  {id: 2, name: "Jane Smith", referredTier: "Ambassador"},
  {id: 3, name: "Alice Johnson", referredTier: "VIP"},
];

// Commission tiers based on referrer's tier
const commissionTiers = {
  "Basic": {
    "Basic": "3%",
    "Ambassador": "3.5%",
    "VIP": "4%"
  },
  "Ambassador": {
    "Basic": "3.5%",
    "Ambassador": "4%",
    "VIP": "4.5%"
  },
  "VIP": {
    "Basic": "4%",
    "Ambassador": "4.5%",
    "VIP": "5%"
  }
};

export default function ReferralTracking() {
  const [referrerTier, setReferrerTier] = useState("Basic"); // Assume default tier
  const [totalCommission, setTotalCommission] = useState(0);

  // Calculate total commission based on referral and commission tiers
  useEffect(() => {
    let commission = 0;
    referralData.forEach((referral) => {
      const commissionRate = commissionTiers[referrerTier as keyof typeof commissionTiers][referral.referredTier as keyof typeof commissionTiers["Basic"]];
      commission += calculateCommission(commissionRate);
    });
    setTotalCommission(commission);
  }, [referrerTier]);

  // Function to calculate commission based on rate (mock calculation)
  const calculateCommission = (rate: string) => {
    const baseValue = 100; // Mock base value for calculation
    const percentage = parseFloat(rate);
    return baseValue * (percentage / 100);
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
          <strong>Total Commission:</strong> R{totalCommission.toFixed(2)}
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
                  {referral.name} (Tier: {referral.referredTier})
                </span>
                <span>{commissionTiers[referrerTier as keyof typeof commissionTiers][referral.referredTier as keyof typeof commissionTiers["Basic"]]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong>Your Tier:</strong>
          <select value={referrerTier} onChange={(e) => setReferrerTier(e.target.value)}>
            <option value="Basic">Basic</option>
            <option value="Ambassador">Ambassador</option>
            <option value="VIP">VIP</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );
}
