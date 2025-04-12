'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

const referralData = [
  {id: 1, name: "John Doe", commission: "R50"},
  {id: 2, name: "Jane Smith", commission: "R75"},
];

export default function ReferralTracking() {
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
          <strong>Total Commission:</strong> R{referralData.reduce((sum, referral) => sum + Number(referral.commission.replace("R", "")), 0)}
        </div>
        <div>
          <strong>Referral List:</strong>
          <ul>
            {referralData.map((referral) => (
              <li key={referral.id} className="flex justify-between items-center">
                <span>{referral.name}</span>
                <span>{referral.commission}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
