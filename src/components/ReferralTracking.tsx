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
import { useAuth } from '@/components/AuthProvider';
import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore";
import { app } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast"; // Import the useToast hook

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
    const { user } = useAuth();
    const [isPayoutRequested, setIsPayoutRequested] = useState(false);
    const db = getFirestore(app);
    const { toast } = useToast();
    const [userReferrals, setUserReferrals] = useState([]);
    const [totalReferredCommission, setTotalReferredCommission] = useState(0); // Track earnings

  // Calculate total commission based on referral and commission tiers
  useEffect(() => {
    let commission = 0;
    referralData.forEach((referral) => {
      const commissionRate = commissionTiers[referrerTier as keyof typeof commissionTiers][referral.referredTier as keyof typeof commissionTiers["Basic"]];
      commission += calculateCommission(commissionRate);
    });
    setTotalCommission(commission);
  }, [referrerTier]);

    // Fetch referral data from Firestore
    useEffect(() => {
        const fetchReferrals = async () => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const referralList = userData.referrals || [];
                        setUserReferrals(referralList);

                        // Calculate the total commission earned from referrals
                        let totalCommission = 0;
                        referralList.forEach(referral => {
                            totalCommission += calculateCommission(
                                commissionTiers[referrerTier as keyof typeof commissionTiers][referral.referredTier as keyof typeof commissionTiers["Basic"]]
                            );
                        });
                        setTotalReferredCommission(totalCommission);
                    } else {
                        console.log("No such document!");
                    }
                } catch (error) {
                    console.error("Error fetching referrals:", error);
                }
            }
        };

        fetchReferrals();
    }, [user, referrerTier, db]);



    // Function to calculate commission based on rate (mock calculation)
  const calculateCommission = (rate: string) => {
    const baseValue = 100; // Mock base value for calculation
    const percentage = parseFloat(rate);
    return baseValue * (percentage / 100);
  };

    const handleRequestPayout = async () => {
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
              <strong>Total Commission:</strong> R{totalReferredCommission.toFixed(2)}
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
