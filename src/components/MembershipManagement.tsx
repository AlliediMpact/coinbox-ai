'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/AuthProvider';
import { MEMBERSHIP_TIERS, MembershipTierType } from '@/lib/membership-tiers';
import { 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  CreditCard, 
  TrendingUp, 
  Unlock, 
  Users,
  Star,
  Shield,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from "framer-motion";
import { colors } from "@/styles/designTokens";

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const cardVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  tap: {
    scale: 0.98,
    boxShadow: "0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30
    }
  },
  selected: {
    scale: 1.05,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  }
};

const featureIconVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 500,
      damping: 25,
    } 
  }
};

const progressBarVariants: Variants = {
  initial: { width: 0 },
  animate: (percent: number) => ({
    width: `${percent}%`,
    transition: { 
      duration: 1.2, 
      ease: "easeOut" 
    }
  })
};

const countUpAnimation = (start: number, end: number, duration: number) => {
  let startTimestamp: number | null = null;
  const step = (timestamp: number) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
    return value;
  };
  return window.requestAnimationFrame(step);
};

// Tier-specific styling
const getTierStyle = (tierName: MembershipTierType) => {
  switch (tierName) {
    case 'Basic':
      return {
        color: '#495057',
        gradient: 'from-gray-200 to-gray-400',
        iconBg: 'bg-gray-100'
      };
    case 'Ambassador':
      return {
        color: '#3B82F6',
        gradient: 'from-blue-100 to-blue-300',
        iconBg: 'bg-blue-50'
      };
    case 'VIP':
      return {
        color: '#8B5CF6',
        gradient: 'from-violet-200 to-purple-400',
        iconBg: 'bg-purple-50'
      };
    case 'Business':
      return {
        color: '#F59E0B',
        gradient: 'from-amber-200 to-yellow-400',
        iconBg: 'bg-amber-50'
      };
    default:
      return {
        color: '#495057',
        gradient: 'from-gray-200 to-gray-400',
        iconBg: 'bg-gray-100'
      };
  }
};

export default function MembershipManagement() {
  // State
  const [selectedTier, setSelectedTier] = useState(MEMBERSHIP_TIERS.Basic);
  const [currentTier, setCurrentTier] = useState<MembershipTierType>('Basic');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [compareMode, setCompareMode] = useState(false);
  
  // Hooks
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleUpgrade = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "Please log in to upgrade your membership",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setPaymentStatus('processing');

    try {
      // Call API route to initialize payment
      const apiResponse = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          amount: selectedTier.securityFee,
          membershipTier: selectedTier.name,
          metadata: {
            securityFee: selectedTier.securityFee,
            refundableAmount: selectedTier.refundableAmount,
            administrationFee: selectedTier.administrationFee
          }
        })
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to initialize payment');
      }

      const response = await apiResponse.json();

      // Redirect to Paystack
      if (response.status && response.data.authorization_url) {
        window.location.href = response.data.authorization_url;
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (error) {
      setPaymentStatus('error');
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch current user membership tier and check payment status
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        // Fetch user's current membership tier
        // This is a placeholder - in a real app, you'd fetch this from your user profile service
        // For demo purposes, we're defaulting to Basic
        
        // For demo purposes, let's show loading state briefly
        setTimeout(() => {
          setCurrentTier('Basic');
        }, 800);
        
        // Check URL parameters for payment status
        const queryParams = new URLSearchParams(window.location.search);
        const reference = queryParams.get('reference');
        const status = queryParams.get('status');
        
        if (reference && status === 'success') {
          setPaymentStatus('success');
          toast({
            title: "Payment Successful",
            description: "Your membership has been upgraded successfully!",
            variant: "default"
          });
          
          // In a real implementation, you would update the user's membership tier here
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, [user, toast]);

  // Function to get tier index (for progress visualization)
  const getTierIndex = (tierName: MembershipTierType): number => {
    const tiers: MembershipTierType[] = ['Basic', 'Ambassador', 'VIP', 'Business'];
    return tiers.indexOf(tierName);
  };
  
  // Calculate progress percentage for tier visualization
  const calculateProgress = (current: MembershipTierType, target: MembershipTierType): number => {
    const currentIndex = getTierIndex(current);
    const targetIndex = getTierIndex(target);
    const totalTiers = Object.keys(MEMBERSHIP_TIERS).length - 1; // -1 because we're calculating progress between tiers
    
    if (currentIndex === targetIndex) return 100;
    
    // Calculate how far along the path we are
    return (currentIndex / totalTiers) * 100;
  };
  
  // Get benefit icon
  const getBenefitIcon = (benefit: string) => {
    if (benefit.toLowerCase().includes('loan')) return <CreditCard className="h-4 w-4" />;
    if (benefit.toLowerCase().includes('invest')) return <TrendingUp className="h-4 w-4" />;
    if (benefit.toLowerCase().includes('commission')) return <Users className="h-4 w-4" />;
    if (benefit.toLowerCase().includes('support')) return <Star className="h-4 w-4" />;
    if (benefit.toLowerCase().includes('dashboard')) return <Shield className="h-4 w-4" />;
    return <Zap className="h-4 w-4" />;
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-2">
          <motion.div variants={itemVariants}>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-primary" />
              Membership & security deposit
            </CardTitle>
          </motion.div>
          <motion.div variants={itemVariants}>
            <CardDescription>
              Choose the CoinBox membership tier that matches how you want to trade,
              borrow and earn — each tier uses a refundable security deposit to unlock
              higher limits and commissions.
            </CardDescription>
          </motion.div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* Tier Selection & Current Status */}
          <motion.div variants={itemVariants} className="mb-8">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Your Membership Journey</h3>
            
            {/* Visual Tier Progress Path */}
            <div className="relative mb-8 px-4">
              <div className="absolute h-1 bg-neutral-200 left-0 right-0 top-5"></div>
              
              <div className="relative flex justify-between">
                {Object.entries(MEMBERSHIP_TIERS).map(([key, tier], index) => {
                  const tierStyle = getTierStyle(key as MembershipTierType);
                  const isCurrent = currentTier === key;
                  const isSelected = selectedTier.name === key;
                  const isPassed = getTierIndex(currentTier) >= index;
                  
                  return (
                    <motion.div 
                      key={key} 
                      className="flex flex-col items-center relative z-10"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                    >
                      <motion.div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center
                          ${isPassed ? 'bg-primary text-white' : 'bg-white border-2 border-neutral-200'} 
                          ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                        `}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const tierObj = MEMBERSHIP_TIERS[key as MembershipTierType];
                          if (tierObj) setSelectedTier(tierObj);
                        }}
                      >
                        {isPassed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <span className="font-medium">{index + 1}</span>
                        )}
                      </motion.div>
                      <p className={`text-xs mt-2 font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                        {tier.displayName}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Animated Progress Bar */}
              <motion.div 
                className="absolute h-1 bg-primary left-0 top-5 origin-left"
                variants={progressBarVariants}
                initial="initial"
                animate="animate"
                custom={calculateProgress(currentTier, selectedTier.name)}
              ></motion.div>
            </div>
            
            {/* Current Tier Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-primary/5 rounded-lg p-4 border border-primary/20 mb-6"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-primary">Current membership tier</p>
                  <h3 className="text-xl font-bold text-primary mt-1">
                    {MEMBERSHIP_TIERS[currentTier].displayName}
                  </h3>
                  <p className="text-xs text-primary/80 mt-1 max-w-md">
                    Your tier controls how much you can invest and borrow on the
                    platform, and the percentage you earn from referral commissions.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-neutral-100">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedTier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tier Details */}
                <div>
                  <motion.div 
                    className={`bg-gradient-to-br ${getTierStyle(selectedTier.name).gradient} rounded-lg p-5 shadow-md relative overflow-hidden mb-4`}
                  >
                    <div className="absolute top-0 right-0 h-24 w-24 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    
                    <h3 className="font-bold text-xl mb-1">{selectedTier.displayName} tier</h3>
                    <p className="text-sm opacity-80 mb-4">
                      This tier sets your security deposit, trading limits and
                      referral commission rate inside CoinBox.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white/30 backdrop-blur-sm p-3 rounded">
                        <p className="font-medium">Security deposit</p>
                        <p className="text-lg font-bold">R{selectedTier.securityFee.toLocaleString()}</p>
                        <p className="text-[11px] mt-1 opacity-90">
                          One-time amount held as a safety deposit to activate
                          this tier.
                        </p>
                      </div>
                      <div className="bg-white/30 backdrop-blur-sm p-3 rounded">
                        <p className="font-medium">Refundable amount</p>
                        <p className="text-lg font-bold">R{selectedTier.refundableAmount.toLocaleString()}</p>
                        <p className="text-[11px] mt-1 opacity-90">
                          Paid back according to your agreement when your
                          membership is closed in good standing.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-sm font-medium">Loan limit</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Maximum amount you can borrow using CoinBox tickets.
                        </p>
                      </div>
                      <span className="font-bold">R{selectedTier.loanLimit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-sm font-medium">Investment limit</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Maximum you can invest into other members&rsquo; tickets.
                        </p>
                      </div>
                      <span className="font-bold">R{selectedTier.investmentLimit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-sm font-medium">Referral commission rate</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Percentage you earn from activity of members you bring
                          to CoinBox.
                        </p>
                      </div>
                      <span className="font-bold">{selectedTier.commissionRate}%</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-sm font-medium">Transaction fee</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Flat fee the platform charges per qualifying
                          transaction.
                        </p>
                      </div>
                      <span className="font-bold">R{selectedTier.transactionFee}</span>
                    </div>
                  </div>
                </div>
                
                {/* Benefits List */}
                <div>
                  <h4 className="font-medium text-sm mb-3 text-muted-foreground">Key Benefits</h4>
                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <ul className="space-y-3">
                      {selectedTier.benefits.map((benefit, index) => (
                        <motion.li 
                          key={index}
                          initial="hidden"
                          animate="visible"
                          variants={itemVariants}
                          custom={index}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center"
                        >
                          <motion.div 
                            variants={featureIconVariants}
                            className={`${getTierStyle(selectedTier.name).iconBg} p-1.5 rounded mr-3 flex-shrink-0`}
                          >
                            {getBenefitIcon(benefit)}
                          </motion.div>
                          <span>{benefit}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                  
                  {selectedTier.name !== currentTier && (
                    <div className="mt-5 bg-primary/5 rounded-lg p-3 border border-primary/10">
                      <h4 className="font-medium flex items-center text-sm">
                        <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                        Benefits Comparison
                      </h4>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">Investment Limit:</span>
                          <div className="flex items-center">
                            <span className="text-muted-foreground">
                              R{MEMBERSHIP_TIERS[currentTier].investmentLimit.toLocaleString()}
                            </span>
                            <ChevronRight className="h-3 w-3 mx-1 text-primary" />
                            <span className="font-medium">
                              R{selectedTier.investmentLimit.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">Commission Rate:</span>
                          <div className="flex items-center">
                            <span className="text-muted-foreground">
                              {MEMBERSHIP_TIERS[currentTier].commissionRate}%
                            </span>
                            <ChevronRight className="h-3 w-3 mx-1 text-primary" />
                            <span className="font-medium">{selectedTier.commissionRate}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Alerts for payment status */}
          <AnimatePresence>
            {paymentStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle>Payment Successful!</AlertTitle>
                  <AlertDescription>
                    Your membership has been upgraded to {selectedTier.displayName}.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {paymentStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Payment Failed</AlertTitle>
                  <AlertDescription>
                    There was an error processing your payment. Please try again.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-4 bg-neutral-50 border-t p-4">
          <Select 
            onValueChange={(value) => {
              const tier = MEMBERSHIP_TIERS[value as keyof typeof MEMBERSHIP_TIERS];
              if (tier) setSelectedTier(tier);
            }}
            value={selectedTier.name}
            disabled={isLoading || paymentStatus === 'processing'}
          >
            <SelectTrigger id="membership" className="w-full sm:w-[180px]">
              <SelectValue placeholder={selectedTier.name} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MEMBERSHIP_TIERS).map(([key, tier]) => (
                <SelectItem key={key} value={key}>
                  {tier.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Button 
              onClick={handleUpgrade}
              disabled={isLoading || paymentStatus === 'processing' || currentTier === selectedTier.name}
              className="w-full bg-gradient-to-r from-primary to-primary/80"
              size="lg"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="mr-2"
                  >
                    <Unlock className="h-4 w-4" />
                  </motion.div>
                  Processing...
                </>
              ) : currentTier === selectedTier.name ? (
                'Current Tier'
              ) : (
                `Upgrade to ${selectedTier.displayName}`
              )}
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
