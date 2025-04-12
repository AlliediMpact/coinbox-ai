'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

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

export default function ReferralTracking() {
  const totalCommission = referralData.reduce((sum, referral) => sum + Number(referral.commission.replace("R", "")), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral Tracking</CardTitle>
        <CardDescription>Track your referrals and commissions.</CardDescription>
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
      </CardContent>
    </Card>
  );
}
