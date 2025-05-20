'use client';

import React, { useState, useEffect } from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from '@/components/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { referralService } from '@/lib/referral-service';
import { commissionService } from '@/lib/commission-service';
import { membershipService } from '@/lib/membership-service';
import { Badge } from "@/components/ui/badge";
import { Copy, Check, RefreshCw } from "lucide-react";

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
  const [referrerTier, setReferrerTier] = useState("Basic");
  const { user } = useAuth();
  const [isPayoutRequested, setIsPayoutRequested] = useState(false);
  const { toast } = useToast();
  const [userReferrals, setUserReferrals] = useState<any[]>([]);
  const [totalReferredCommission, setTotalReferredCommission] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [referralStats, setReferralStats] = useState<any>(null);

  // Fetch referral data from services
  useEffect(() => {
    const fetchReferrals = async () => {
      if (user) {
        setIsLoadingStats(true);
        try {
          // Fetch user membership tier
          const membership = await membershipService.getUserMembership(user.uid);
          if (membership) {
            setReferrerTier(membership.currentTier);
          }

          // Fetch referral code
          const code = await referralService.getUserReferralCode(user.uid);
          setReferralCode(code);

          // Fetch referral stats
          const stats = await referralService.getReferralStats(user.uid);
          setReferralStats(stats);
          
          // Fetch referrals
          const referrals = await referralService.getUserReferrals(user.uid);
          setUserReferrals(referrals);

          // Get total commission
          const totalCommission = stats?.totalCommissions || 0;
          setTotalReferredCommission(totalCommission);
        } catch (error) {
          console.error("Error fetching referrals:", error);
          toast({
            title: "Error",
            description: "Failed to load referral data",
            variant: "destructive"
          });
        } finally {
          setIsLoadingStats(false);
        }
      }
    };

    fetchReferrals();
  }, [user, toast]);

  // Calculate commission based on rate
  const calculateCommission = (rate: string) => {
    const baseValue = 100; // Mock base value for calculation
    const percentage = parseFloat(rate);
    return baseValue * (percentage / 100);
  };

  // Handle commission withdrawal
  const handleRequestPayout = async () => {
    if (!user) return;
    
    setIsPayoutRequested(true);
    try {
      const result = await commissionService.withdrawCommissions(user.uid);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default"
        });
        
        // Refresh stats after withdrawal
        const updatedStats = await referralService.getReferralStats(user.uid);
        setReferralStats(updatedStats);
        setTotalReferredCommission(updatedStats?.totalCommissions || 0);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive"
      });
    } finally {
      setIsPayoutRequested(false);
    }
  };

  // Generate referral code
  const handleGenerateCode = async () => {
    if (!user) return;
    
    setIsGeneratingCode(true);
    try {
      const code = await referralService.createReferralCode(user.uid);
      setReferralCode(code);
      toast({
        title: "Success",
        description: "Referral code generated successfully",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate referral code",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Copy referral code to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
      variant: "default"
    });
  };

  if (isLoadingStats) {
    return (
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <p className="text-center mt-4">Loading referral data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Referral Tracking</CardTitle>
        <CardDescription className="text-gray-500">Track your referrals and commissions.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* Referral Code Section */}
        <div className="bg-muted/30 p-4 rounded-md">
          <h3 className="text-sm font-medium mb-2">Your Referral Code</h3>
          {referralCode ? (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-lg px-3 py-1 font-mono bg-primary/5 flex-grow">
                {referralCode}
              </Badge>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(referralCode)}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">No referral code yet</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateCode}
                disabled={isGeneratingCode}
              >
                {isGeneratingCode ? (
                  <>
                    <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Code'
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div>
          <strong>Total Referrals:</strong> {userReferrals.length}
        </div>
        <div>
          <strong>Total Commission:</strong> R{totalReferredCommission.toFixed(2)}
        </div>
        <div>
          <strong>Commission Payout Status:</strong> {referralStats?.pendingCommissions > 0 
            ? `R${referralStats.pendingCommissions.toFixed(2)} available to withdraw` 
            : 'No pending commissions'}
        </div>

        {/* Referral List */}
        <div>
          <strong>Referral List:</strong>
          {userReferrals.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {userReferrals.map((referral) => (
                <li key={referral.id} className="flex justify-between items-center p-2 rounded-md bg-muted/20">
                  <span>
                    {referral.displayName || referral.email || 'User'} (Tier: {referral.tier || 'Basic'})
                  </span>
                  <span>
                    {referral.commissionsEarned 
                      ? `R${referral.commissionsEarned.toFixed(2)}` 
                      : commissionTiers[referrerTier as keyof typeof commissionTiers]?.[referral.tier as keyof typeof commissionTiers["Basic"]] || 'N/A'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">You haven't referred anyone yet</p>
          )}
        </div>

        {/* Tier Selection - for demo only, in real app this would be determined by user's membership */}
        <div>
          <strong>Your Tier:</strong>
          <select 
            value={referrerTier} 
            onChange={(e) => setReferrerTier(e.target.value)}
            className="ml-2 p-1 rounded-md border"
          >
            <option value="Basic">Basic</option>
            <option value="Ambassador">Ambassador</option>
            <option value="VIP">VIP</option>
          </select>
        </div>

        {/* Withdraw Button */}
        {!isPayoutRequested ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleRequestPayout}
                  disabled={!referralStats?.pendingCommissions || referralStats.pendingCommissions <= 0}
                >
                  Withdraw Earnings
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Click to withdraw your referral earnings
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <p>Processing payout...</p>
        )}
        
        {/* View Full Dashboard Link */}
        <div className="mt-2 text-center">
          <a href="/dashboard/referral" className="text-sm text-primary hover:underline">
            View full referral dashboard
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
