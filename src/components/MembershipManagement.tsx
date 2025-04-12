'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useState} from "react";

const membershipTiers = [
  {
    name: "Basic",
    securityFee: "R500",
    loanLimit: "R500",
    investmentLimit: "R5,000",
    commissionRate: "1%",
  },
  {
    name: "Ambassador",
    securityFee: "R1,000",
    loanLimit: "R1,000",
    investmentLimit: "R10,000",
    commissionRate: "2%",
  },
  {
    name: "VIP",
    securityFee: "R5,000",
    loanLimit: "R5,000",
    investmentLimit: "R50,000",
    commissionRate: "3%",
  },
  {
    name: "Business",
    securityFee: "R10,000",
    loanLimit: "R10,000",
    investmentLimit: "R100,000",
    commissionRate: "5%",
  },
];

export default function MembershipManagement() {
  const [selectedTier, setSelectedTier] = useState(membershipTiers[0]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership Management</CardTitle>
        <CardDescription>View and manage your membership tier.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="membership">Select Membership Tier</label>
          <Select onValueChange={(value) => {
            const tier = membershipTiers.find((t) => t.name === value);
            if (tier) {
              setSelectedTier(tier);
            }
          }}>
            <SelectTrigger id="membership">
              <SelectValue placeholder={selectedTier.name} />
            </SelectTrigger>
            <SelectContent>
              {membershipTiers.map((tier) => (
                <SelectItem key={tier.name} value={tier.name}>
                  {tier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <p>
            <strong>Security Fee:</strong> {selectedTier.securityFee}
          </p>
          <p>
            <strong>Loan Limit:</strong> {selectedTier.loanLimit}
          </p>
          <p>
            <strong>Investment Limit:</strong> {selectedTier.investmentLimit}
          </p>
          <p>
            <strong>Commission Rate:</strong> {selectedTier.commissionRate}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
