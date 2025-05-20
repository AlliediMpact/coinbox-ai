'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { referralService } from '@/lib/referral-service';
import { commissionService } from '@/lib/commission-service';
import { membershipService } from '@/lib/membership-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ReferralStats } from '@/components/referral/ReferralStats';
import { ReferralList } from '@/components/referral/ReferralList';
import { CommissionHistory } from '@/components/referral/CommissionHistory';
import { ReferralCodeGenerator } from '@/components/referral/ReferralCodeGenerator';

export default function ReferralDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [referralStats, setReferralStats] = useState<any>(null);
  const [referralsList, setReferralsList] = useState<any[]>([]);
  const [commissionsHistory, setCommissionsHistory] = useState<any[]>([]);
  const [userMembership, setUserMembership] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchReferralData = async () => {
      setIsLoading(true);
      try {
        // Fetch all referral data in parallel
        const [stats, commissions, membership, referrals, code] = await Promise.all([
          referralService.getReferralStats(user.uid),
          commissionService.getCommissionHistory(user.uid),
          membershipService.getUserMembership(user.uid),
          commissionService.getActiveReferrals(user.uid),
          referralService.getUserReferralCode(user.uid)
        ]);

        setReferralStats(stats);
        setCommissionsHistory(commissions);
        setUserMembership(membership);
        setReferralsList(referrals);
        setReferralCode(code);
      } catch (error) {
        console.error("Error fetching referral data:", error);
        toast({
          title: "Error",
          description: "Failed to load referral data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferralData();
  }, [user, toast]);

  const handleWithdrawCommissions = async () => {
    if (!user) return;
    
    try {
      const result = await commissionService.withdrawCommissions(user.uid);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        });
        
        // Refresh commission history
        const updatedCommissions = await commissionService.getCommissionHistory(user.uid);
        setCommissionsHistory(updatedCommissions);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    }
  };

  const generateReferralCode = async () => {
    if (!user) return;
    
    try {
      const code = await referralService.createReferralCode(user.uid);
      setReferralCode(code);
      toast({
        title: "Success",
        description: "Referral code generated successfully!",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate referral code",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <p className="text-center mt-4">Loading referral dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Referral Program</h2>
      
      {/* Referral Code Section */}
      <ReferralCodeGenerator 
        referralCode={referralCode} 
        onGenerate={generateReferralCode} 
      />
      
      {/* Quick Stats Overview */}
      <ReferralStats 
        stats={referralStats} 
        membership={userMembership} 
        onWithdraw={handleWithdrawCommissions}
      />
      
      {/* Detailed Tabs */}
      <Tabs defaultValue="referrals" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="referrals">My Referrals</TabsTrigger>
          <TabsTrigger value="commissions">Commission History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="referrals" className="mt-4">
          <ReferralList referrals={referralsList} membership={userMembership} />
        </TabsContent>
        
        <TabsContent value="commissions" className="mt-4">
          <CommissionHistory commissions={commissionsHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
