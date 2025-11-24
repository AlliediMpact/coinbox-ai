'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './AuthProvider';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { 
  ArrowRight, 
  Check, 
  Coins, 
  Shield, 
  User, 
  Wallet, 
  X,
  HelpCircle,
  Users,
  RefreshCcw,
  Share2,
  CheckCircle
} from "lucide-react";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: string[];
  component?: React.ReactNode;
}

interface UserOnboardingProps {
  onComplete?: () => void;
  disableAutoShow?: boolean;
}

interface OnboardingState {
  completed: string[];
  dismissed: boolean;
  lastShown: number | null;
}

export default function UserOnboarding({ onComplete, disableAutoShow = false }: UserOnboardingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTutorialIndex, setCurrentTutorialIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    completed: [],
    dismissed: false,
    lastShown: null
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const tutorials = useMemo(() => [
    {
      id: 'dashboard',
      title: 'Welcome to Allied iMpact Coin Box',
      description: 'Let us get you started with the basics',
      icon: <User className="h-5 w-5" />,
      content: [
        'Welcome to the Allied iMpact Coin Box platform! We will walk you through the key features to help you get started.',
        'The dashboard gives you an overview of your wallet balance, commissions, and recent activities.',
        'You can customize your experience by completing your profile and verifying your identity through KYC.'
      ]
    },
    {
      id: 'trading',
      title: 'Coin Trading Basics',
      description: 'Learn how to trade coins on our platform',
      icon: <Coins className="h-5 w-5" />,
      content: [
        'Coin trading allows you to buy and sell coins with other users in a secure, peer-to-peer environment.',
        'Each trade is protected by our escrow system, which holds the coins until both parties confirm the transaction.',
        'You can create trade offers or respond to existing ones from the Coin Trading section.'
      ]
    },
    {
      id: 'wallet',
      title: 'Managing Your Wallet',
      description: 'Understanding your financial dashboard',
      icon: <Wallet className="h-5 w-5" />,
      content: [
        'Your wallet shows your available balance, locked funds (in escrow), and total balance.',
        'You can deposit funds through various payment methods and withdraw them to your linked accounts.',
        'All transactions are securely logged and can be viewed in your transaction history.'
      ]
    },
    {
      id: 'security',
      title: 'Security Features',
      description: 'Keeping your account secure',
      icon: <Shield className="h-5 w-5" />,
      content: [
        'We recommend enabling two-factor authentication (2FA) to add an extra layer of security to your account.',
        'Regularly review your security settings and monitor your account for any suspicious activities.',
        'Our system monitors transactions for unusual patterns and will alert you to potential security concerns.'
      ]
    },
    {
      id: 'referral',
      title: 'Referral Program',
      description: 'Earn by inviting friends',
      icon: <Share2 className="h-5 w-5" />,
      content: [
        'Share your unique referral code with friends to earn commission on their trades.',
        'You will receive commissions based on your membership tier when your referrals complete transactions.',
        'Track your referrals and earnings in the Referrals section of your dashboard.'
      ]
    }
  ], []);

  // Load onboarding state from Firestore on component mount
  useEffect(() => {
    const loadOnboardingState = async () => {
      if (!user) return;

      try {
        const db = getFirestore();
        const onboardingRef = doc(db, "user_preferences", user.uid);
        const onboardingDoc = await getDoc(onboardingRef);

        if (onboardingDoc.exists()) {
          const data = onboardingDoc.data();
          setOnboardingState({
            completed: data.completedTutorials || [],
            dismissed: data.onboardingDismissed || false,
            lastShown: data.lastOnboardingShown || null
          });
        } else {
          // Initialize onboarding state for new user
          await setDoc(onboardingRef, {
            completedTutorials: [],
            onboardingDismissed: false,
            lastOnboardingShown: Date.now()
          });
          setOnboardingState({
            completed: [],
            dismissed: false,
            lastShown: Date.now()
          });
        }
      } catch (error) {
        console.error("Error loading onboarding state:", error);
      }
    };

    loadOnboardingState();
  }, [user]);

  const updateLastShown = useCallback(async () => {
    if (!user) return;

    try {
      const db = getFirestore();
      const onboardingRef = doc(db, "user_preferences", user.uid);
      await setDoc(onboardingRef, {
        lastOnboardingShown: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating onboarding shown time:", error);
    }
  }, [user]);

  // Show onboarding automatically for new users
  useEffect(() => {
    const shouldShowOnboarding = () => {
      if (disableAutoShow || !onboardingState) return false;

      const allCompleted = tutorials.every(t => onboardingState.completed.includes(t.id));
      if (allCompleted && onboardingState.dismissed) return false;

      const lastShown = onboardingState.lastOnboardingShown || 0;
      const daysSinceLastShown = (Date.now() - lastShown) / (1000 * 60 * 60 * 24);
      
      // Show if never shown, or if it's been more than a day and not all tutorials are complete
      const timeSinceFirstInteraction = onboardingState.firstInteractionTimestamp
        ? (Date.now() - onboardingState.firstInteractionTimestamp) / (1000 * 60 * 60 * 24)
        : 999; // Large number to ensure it shows if never shown
      
      return !onboardingState.dismissed && 
        (!onboardingState.completed.length || 
         (daysSinceLastShown > 1 && !allCompleted));
    };

    if (user && shouldShowOnboarding()) {
      // Find first incomplete tutorial
      const firstIncompleteTutorial = tutorials.findIndex(
        t => !onboardingState.completed.includes(t.id)
      );
      if (firstIncompleteTutorial !== -1) {
        setCurrentTutorialIndex(firstIncompleteTutorial);
      }
      setIsVisible(true);
      updateLastShown();
    }
  }, [onboardingState, user, disableAutoShow, tutorials, updateLastShown]);

  const markTutorialComplete = async (tutorialId: string) => {
    if (!user) return;
    
    try {
      // Update local state
      setOnboardingState(prev => ({
        ...prev,
        completed: [...prev.completed, tutorialId]
      }));
      
      // Update in Firestore
      const db = getFirestore();
      const onboardingRef = doc(db, "user_preferences", user.uid);
      await setDoc(onboardingRef, {
        completedTutorials: [...onboardingState.completed, tutorialId]
      }, { merge: true });
    } catch (error) {
      console.error("Error marking tutorial complete:", error);
    }
  };

  const dismissOnboarding = async () => {
    if (!user) return;
    
    try {
      // Update local state
      setOnboardingState(prev => ({
        ...prev,
        dismissed: true
      }));
      
      // Update in Firestore
      const db = getFirestore();
      const onboardingRef = doc(db, "user_preferences", user.uid);
      await setDoc(onboardingRef, {
        onboardingDismissed: true
      }, { merge: true });
    } catch (error) {
      console.error("Error dismissing onboarding:", error);
    }
    
    setIsVisible(false);
  };

  const handleNext = () => {
    const currentTutorial = tutorials[currentTutorialIndex];
    
    if (currentStepIndex < currentTutorial.content.length - 1) {
      // Move to next step in current tutorial
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Mark current tutorial as complete
      markTutorialComplete(currentTutorial.id);
      
      // Move to next tutorial or close if done
      if (currentTutorialIndex < tutorials.length - 1) {
        setCurrentTutorialIndex(currentTutorialIndex + 1);
        setCurrentStepIndex(0);
      } else {
        // All tutorials complete
        setIsVisible(false);
        if (onComplete) onComplete();
        
        toast({
          title: "Onboarding Complete!",
          description: "You've completed all introduction guides. You can access these again from Help Center.",
        });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      // Move to previous step in current tutorial
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      // Move to previous tutorial
      if (currentTutorialIndex > 0) {
        setCurrentTutorialIndex(currentTutorialIndex - 1);
        // Set to last step of previous tutorial
        const prevTutorial = tutorials[currentTutorialIndex - 1];
        setCurrentStepIndex(prevTutorial.content.length - 1);
      }
    }
  };

  const openSpecificTutorial = (index: number) => {
    setCurrentTutorialIndex(index);
    setCurrentStepIndex(0);
    setIsVisible(true);
    updateLastShown();
  };

  // Component to show in UI for opening tutorials
  const TutorialLauncher = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Tutorial Guides</h3>
      <div className="grid gap-2">
        {tutorials.map((tutorial, index) => {
          const isCompleted = onboardingState.completed.includes(tutorial.id);
          return (
            <Button
              key={tutorial.id}
              variant={isCompleted ? "outline" : "secondary"}
              className="justify-start"
              onClick={() => openSpecificTutorial(index)}
            >
              <div className="mr-2">{tutorial.icon}</div>
              <span>{tutorial.title}</span>
              {isCompleted && <CheckCircle className="ml-auto h-4 w-4 text-green-500" />}
            </Button>
          );
        })}
      </div>
    </div>
  );

  if (!isVisible) {
    return null;
  }

  const currentTutorial = tutorials[currentTutorialIndex];
  const progress = ((currentTutorialIndex * 100) + 
                    (currentStepIndex / (currentTutorial.content.length - 1) * 100)) / 
                    tutorials.length;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="w-full max-w-2xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/20 rounded-full">
                    {currentTutorial.icon}
                  </div>
                  <div>
                    <CardTitle>{currentTutorial.title}</CardTitle>
                    <CardDescription>{currentTutorial.description}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={dismissOnboarding}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Progress value={progress} className="mt-4 h-1" />
            </CardHeader>
            <CardContent className="pt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentTutorialIndex}-${currentStepIndex}`}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ type: "spring", damping: 25 }}
                  className="min-h-[150px]"
                >
                  <p className="text-base">{currentTutorial.content[currentStepIndex]}</p>
                  {currentTutorial.component && <div className="mt-4">{currentTutorial.component}</div>}
                </motion.div>
              </AnimatePresence>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentTutorialIndex === 0 && currentStepIndex === 0}
                >
                  Previous
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleNext}
                  className="flex items-center"
                >
                  {currentTutorialIndex === tutorials.length - 1 && 
                   currentStepIndex === currentTutorial.content.length - 1 
                   ? 'Complete' 
                   : 'Next'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {currentTutorial.content.length}
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Export the launcher component for use elsewhere
export { UserOnboarding };
