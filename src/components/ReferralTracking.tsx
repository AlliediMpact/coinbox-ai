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
import { Copy, Check, RefreshCw, Gift, DollarSign, Users, Share2 } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { colors, animations } from "@/styles/designTokens";

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

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const cardVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    tap: {
      scale: 0.98
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 10, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };
  
  if (isLoadingStats) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="shadow-md overflow-hidden">
          <CardContent className="pt-6 pb-8">
            <div className="flex flex-col items-center justify-center space-y-6">
              <motion.div 
                animate={{ 
                  rotate: 360, 
                  scale: [1, 1.1, 1] 
                }}
                transition={{ 
                  rotate: { repeat: Infinity, duration: 1.5, ease: "linear" },
                  scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                }}
                className="rounded-full p-3 bg-primary/5"
              >
                <RefreshCw className="h-8 w-8 text-primary" />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2 text-center"
              >
                <p className="font-medium text-lg">Loading referral data</p>
                <p className="text-sm text-muted-foreground">Please wait while we fetch your information</p>
              </motion.div>
              
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "70%" }}
                transition={{ 
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                  repeatType: "reverse"
                }}
                className="h-1 bg-primary/60 rounded-full"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="h-full"
    >
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        whileTap="tap"
        className="h-full"
      >
        <Card className="shadow-lg border-t-4 border-t-primary/80 h-full flex flex-col overflow-hidden">
          <CardHeader className="pb-2">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-lg font-semibold flex items-center">
                <Share2 className="h-5 w-5 mr-2 text-primary" />
                Referral Tracking
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription>Track your referrals and earn commission rewards</CardDescription>
            </motion.div>
          </CardHeader>
            
          <CardContent className="grid gap-6 flex-grow">
            {/* Referral Code Section */}
            <motion.div 
              variants={itemVariants}
              className="group bg-gradient-to-r from-primary/5 to-primary/10 p-5 rounded-lg border border-primary/20"
            >
              <h3 className="text-sm font-medium mb-3 flex items-center text-primary">
                <Gift className="h-4 w-4 mr-1.5" />
                Your Referral Code
              </h3>
              
              <AnimatePresence mode="wait">
                {referralCode ? (
                  <motion.div 
                    key="code"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center space-x-2"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="relative flex-grow"
                    >
                      <Badge 
                        variant="outline" 
                        className="text-lg px-4 py-2 font-mono bg-white/80 flex-grow w-full shadow-sm"
                      >
                        {referralCode}
                      </Badge>
                      <motion.div 
                        className="absolute inset-0 bg-primary/5 rounded-md"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                        style={{ transformOrigin: "left" }}
                      />
                    </motion.div>
                    
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(referralCode)}
                        className="shrink-0 shadow-sm bg-white"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="no-code"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center space-x-3"
                  >
                    <p className="text-sm text-muted-foreground">No referral code yet</p>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleGenerateCode}
                        disabled={isGeneratingCode}
                        className="bg-white shadow-sm"
                      >
                        {isGeneratingCode ? (
                          <>
                            <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Gift className="mr-1.5 h-4 w-4" />
                            Generate Code
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Stats Section - Animated Metrics Cards */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Total Referrals Card */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-primary/10 w-16 h-16 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <Users className="h-5 w-5 text-primary/70 mb-1" />
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <div className="flex items-end space-x-1 mt-1">
                  <motion.p 
                    className="text-2xl font-bold"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      type: "spring", 
                      delay: 0.3,
                      stiffness: 100
                    }}
                  >
                    {userReferrals.length}
                  </motion.p>
                  <p className="text-xs text-muted-foreground mb-1">people</p>
                </div>
              </motion.div>
              
              {/* Total Commission Card */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-primary/10 w-16 h-16 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <DollarSign className="h-5 w-5 text-primary/70 mb-1" />
                <p className="text-sm text-muted-foreground">Total Commission</p>
                <div className="flex items-end space-x-1 mt-1">
                  <motion.p 
                    className="text-2xl font-bold"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      delay: 0.4,
                      stiffness: 100
                    }}
                  >
                    R{totalReferredCommission.toFixed(2)}
                  </motion.p>
                </div>
              </motion.div>
              
              {/* Pending Commission Card */}
              <motion.div 
                whileHover={{ y: -4 }}
                className={`bg-white p-4 rounded-lg border shadow-sm relative overflow-hidden ${
                  referralStats?.pendingCommissions > 0 
                  ? 'border-primary/30' 
                  : 'border-neutral-200'
                }`}
              >
                <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-1/2 translate-x-1/2 ${
                  referralStats?.pendingCommissions > 0 
                  ? 'bg-primary/20' 
                  : 'bg-neutral-100'
                }`} />
                
                <DollarSign className={`h-5 w-5 mb-1 ${
                  referralStats?.pendingCommissions > 0 
                  ? 'text-primary/70' 
                  : 'text-neutral-400'
                }`} />
                <p className="text-sm text-muted-foreground">Available to Withdraw</p>
                <div className="flex items-end space-x-1 mt-1">
                  <motion.p 
                    className={`text-2xl font-bold ${
                      referralStats?.pendingCommissions > 0 
                      ? '' 
                      : 'text-neutral-500'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ 
                      delay: 0.5,
                      duration: 0.4
                    }}
                  >
                    {referralStats?.pendingCommissions > 0 
                      ? `R${referralStats.pendingCommissions.toFixed(2)}`
                      : 'R0.00'}
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>

            {/* Referral List */}
            <motion.div variants={itemVariants} className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
                <h3 className="font-medium text-sm flex items-center">
                  <Users className="h-4 w-4 mr-1.5 text-primary/70" />
                  Your Referrals
                </h3>
                <Badge variant="outline" className="bg-white">
                  {userReferrals.length} {userReferrals.length === 1 ? 'person' : 'people'}
                </Badge>
              </div>
              
              {userReferrals.length > 0 ? (
                <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-neutral-200">
                  <AnimatePresence>
                    <motion.ul className="divide-y divide-neutral-100">
                      {userReferrals.map((referral, index) => (
                        <motion.li 
                          key={referral.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 0.05 * index,
                            duration: 0.2
                          }}
                          whileHover={{ backgroundColor: "rgba(0,0,0,0.01)" }}
                          className="flex justify-between items-center p-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                              {(referral.displayName || referral.email || 'User').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {referral.displayName || referral.email || 'User'}
                              </p>
                              <div className="flex items-center mt-0.5">
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                  {referral.tier || 'Basic'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-semibold">
                              {referral.commissionsEarned 
                                ? `R${referral.commissionsEarned.toFixed(2)}` 
                                : commissionTiers[referrerTier as keyof typeof commissionTiers]?.[referral.tier as keyof typeof commissionTiers["Basic"]] || &apos;N/A&apos;}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              commission
                            </p>
                          </div>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </AnimatePresence>
                </div>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">You haven&apos;t referred anyone yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                    Share your referral code with friends to start earning commission
                  </p>
                </div>
              )}
            </motion.div>

            {/* Membership Tier */}
            <motion.div 
              variants={itemVariants}
              className="bg-gradient-to-br from-primary/10 to-primary/5 p-5 rounded-lg border border-primary/20 flex flex-col sm:flex-row justify-between gap-4"
            >
              <div className="flex-grow">
                <h3 className="text-sm font-medium flex items-center mb-2 text-primary">
                  <Gift className="h-4 w-4 mr-1.5" />
                  Your Membership Tier
                </h3>
                
                <div className="flex flex-col space-y-1">
                  {/* Tier badges */}
                  <div className="flex items-center space-x-2">
                    {["Basic", "Ambassador", "VIP"].map((tier) => (
                      <motion.div
                        key={tier}
                        animate={tier === referrerTier ? "active" : "inactive"}
                        variants={{
                          active: { 
                            scale: 1.05, 
                            backgroundColor: "rgba(94, 23, 235, 0.1)",
                            borderColor: "rgba(94, 23, 235, 0.4)",
                          },
                          inactive: { 
                            scale: 1, 
                            backgroundColor: "rgba(255, 255, 255, 0.7)",
                            borderColor: "rgba(0, 0, 0, 0.1)",
                          }
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20
                        }}
                        className={`px-3 py-1.5 rounded-md border cursor-pointer`}
                        onClick={() => setReferrerTier(tier)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <p className={`text-sm font-medium ${tier === referrerTier ? 'text-primary' : 'text-neutral-500'}`}>
                          {tier}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Higher tiers earn more commission on referrals
                  </p>
                </div>
              </div>
              
              <div className="shrink-0 flex items-center">
                <div className="rounded-lg bg-white p-3 border border-neutral-200 shadow-sm">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Max. Commission Rate</p>
                    <p className="text-xl font-bold text-primary">
                      {commissionTiers[referrerTier as keyof typeof commissionTiers]?.["VIP"] || &apos;5%&apos;}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Action Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              {/* Withdraw Button */}
              {!isPayoutRequested ? (
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.02 }}
                  className="w-full sm:w-auto"
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={handleRequestPayout}
                          disabled={!referralStats?.pendingCommissions || referralStats.pendingCommissions <= 0}
                          className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 shadow-md hover:shadow-lg transition-all"
                        >
                          <DollarSign className="h-4 w-4 mr-1.5" />
                          Withdraw Earnings
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Click to withdraw your referral earnings</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              ) : (
                <div className="flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-md">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm font-medium text-primary">Processing withdrawal...</p>
                </div>
              )}
              
              {/* View Full Dashboard Link */}
              <motion.div 
                whileHover={{ scale: 1.03 }} 
                className="w-full sm:w-auto flex justify-center"
              >
                <a 
                  href="/dashboard/referral" 
                  className="text-sm text-primary hover:underline flex items-center px-4 py-2 rounded-md hover:bg-primary/5 transition-colors"
                >
                  <Users className="h-4 w-4 mr-1.5" />
                  View full referral dashboard
                </a>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
