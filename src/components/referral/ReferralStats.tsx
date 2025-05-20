'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CircleCheck, CircleDollarSign, Users, Clock } from "lucide-react";

interface ReferralStatsProps {
  stats: any;
  membership: any;
  onWithdraw: () => Promise<void>;
}

export function ReferralStats({ stats, membership, onWithdraw }: ReferralStatsProps) {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  if (!stats) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle>Referral Program Stats</CardTitle>
          <CardDescription>No referral data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Start referring friends to earn commissions and view your stats here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    await onWithdraw();
    setIsWithdrawing(false);
  };

  // Calculate progress toward next tier
  const currentTier = membership?.currentTier || 'basic';
  const nextTierMap: Record<string, string> = {
    'basic': 'ambassador',
    'ambassador': 'vip',
    'vip': 'business',
    'business': 'business' // No higher tier
  };
  
  const nextTier = nextTierMap[currentTier];
  const isMaxTier = currentTier === nextTier;
  
  // Calculate progress percentages (these would be real calculations in production)
  const referralProgress = isMaxTier ? 100 : Math.min(
    100, 
    Math.floor((stats.activeReferrals || 0) / (membership?.nextTierRequirements?.minReferrals || 5) * 100)
  );
  
  const volumeProgress = isMaxTier ? 100 : Math.min(
    100,
    Math.floor((stats.totalVolume || 0) / (membership?.nextTierRequirements?.minMonthlyVolume || 10000) * 100)
  );

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeReferrals || 0} active referrals
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{stats.totalCommissions?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings from referrals
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available to Withdraw</CardTitle>
            <CircleCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{stats.pendingCommissions?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingCommissions > 0 ? "Ready to withdraw" : "No funds to withdraw"}
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setShowConfirmDialog(true)} 
              disabled={!stats.pendingCommissions || stats.pendingCommissions <= 0 || isWithdrawing}
              className="w-full"
              variant="outline"
            >
              {isWithdrawing ? "Processing..." : "Withdraw Funds"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Commission</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14 days</div>
            <p className="text-xs text-muted-foreground">
              Next automatic payout period
            </p>
          </CardContent>
        </Card>
      </div>

      {!isMaxTier && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Progress to {nextTier.charAt(0).toUpperCase() + nextTier.slice(1)} Tier</CardTitle>
            <CardDescription>Complete these milestones to unlock higher commission rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Referrals</span>
                  <span className="text-sm text-muted-foreground">{referralProgress}%</span>
                </div>
                <Progress value={referralProgress} className="h-2" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.activeReferrals || 0} of {membership?.nextTierRequirements?.minReferrals || 5} required referrals
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Trading Volume</span>
                  <span className="text-sm text-muted-foreground">{volumeProgress}%</span>
                </div>
                <Progress value={volumeProgress} className="h-2" />
                <p className="mt-1 text-xs text-muted-foreground">
                  R{stats.totalVolume?.toFixed(2) || "0.00"} of R{membership?.nextTierRequirements?.minMonthlyVolume || "10,000"} required volume
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Commission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw R{stats.pendingCommissions?.toFixed(2)} to your wallet?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdraw} disabled={isWithdrawing}>
              {isWithdrawing ? "Processing..." : "Confirm Withdrawal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
