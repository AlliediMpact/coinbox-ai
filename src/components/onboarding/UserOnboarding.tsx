'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useOnboarding } from '@/components/onboarding/OnboardingProvider';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, 
  ChevronRight, 
  HelpCircle, 
  BookOpen, 
  Play, 
  Lightbulb,
  Award,
  AlertTriangle
} from "lucide-react";

export default function UserOnboarding() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { 
    showOnboarding, 
    completeOnboarding, 
    resetOnboarding, 
    onboardingProgress, 
    updateProgress 
  } = useOnboarding();
  
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('guide');

  // Mock data - in a real app, this would be stored in Firestore
  const onboardingSteps = [
    {
      id: 1,
      title: "Welcome to CoinBox",
      description: "Learn about our P2P trading platform and get started",
      content: "CoinBox is a peer-to-peer financial platform that allows users to trade cryptocurrencies and digital assets safely and securely. This onboarding process will guide you through setting up your account and making your first trade.",
      action: "Next"
    },
    {
      id: 2,
      title: "Complete Your Profile",
      description: "Add your personal information and verify your identity",
      content: "To ensure the security of all users on our platform, we require identity verification. This helps prevent fraud and ensures compliance with regulatory requirements. Click the button below to complete your profile setup.",
      action: "Set up profile"
    },
    {
      id: 3,
      title: "Add Payment Methods",
      description: "Connect your bank account or other payment methods",
      content: "To buy or sell on CoinBox, you'll need to add at least one payment method. We support bank transfers, credit/debit cards, and mobile payment services. All payment information is encrypted and secured.",
      action: "Add payment method"
    },
    {
      id: 4,
      title: "Make Your First Trade",
      description: "Learn how to create a buy or sell order",
      content: "Trading on CoinBox is easy! Browse available offers, select one that matches your needs, and follow the guided process to complete your first trade. Our escrow system ensures that both parties are protected throughout the transaction.",
      action: "View trading guide"
    },
    {
      id: 5,
      title: "Enable Security Features",
      description: "Set up two-factor authentication for extra protection",
      content: "Security is our top priority. We strongly recommend enabling two-factor authentication (2FA) to protect your account. This adds an extra layer of security by requiring a code from your mobile device in addition to your password.",
      action: "Enable 2FA"
    }
  ];

  // Educational content for the "Learn" tab
  const educationalContent = [
    {
      id: "basics",
      title: "P2P Trading Basics",
      content: "Peer-to-peer trading allows you to buy and sell digital assets directly with other users, without intermediaries. This guide explains how the process works and the benefits of P2P trading.",
      video: "https://example.com/videos/p2p-basics",
      reading: "10 min",
      difficulty: "Beginner"
    },
    {
      id: "security",
      title: "Security Best Practices",
      content: "Learn how to keep your account and funds safe with proper security measures, including strong passwords, 2FA, and recognizing potential scams.",
      video: "https://example.com/videos/security-basics",
      reading: "15 min",
      difficulty: "Beginner"
    },
    {
      id: "escrow",
      title: "Understanding Escrow",
      content: "Our escrow system protects both buyers and sellers by holding funds until all conditions of the trade are met. This guide explains how escrow works and why it's important.",
      video: "https://example.com/videos/escrow-explained",
      reading: "12 min",
      difficulty: "Intermediate"
    },
    {
      id: "advanced",
      title: "Advanced Trading Strategies",
      content: "Once you're familiar with basic P2P trading, explore more advanced strategies to optimize your trading experience and potentially increase your returns.",
      video: "https://example.com/videos/advanced-trading",
      reading: "20 min",
      difficulty: "Advanced"
    }
  ];

  useEffect(() => {
    // Initialize completed steps from local storage if available
    if (user) {
      const savedSteps = localStorage.getItem(`completedSteps_${user.uid}`);
      if (savedSteps) {
        setCompletedSteps(JSON.parse(savedSteps));
        
        // Calculate current step based on completed steps
        const completedCount = JSON.parse(savedSteps).length;
        if (completedCount < onboardingSteps.length) {
          setCurrentStep(completedCount);
        }
      }
    }
  }, [user, onboardingSteps.length]);

  const handleStepComplete = (stepId: number) => {
    const newCompletedSteps = [...completedSteps];
    if (!newCompletedSteps.includes(stepId)) {
      newCompletedSteps.push(stepId);
      setCompletedSteps(newCompletedSteps);
    }
    
    // Calculate progress
    const progress = Math.round((newCompletedSteps.length / onboardingSteps.length) * 100);
    
    // Update progress through context
    updateProgress(progress);
    
    // Save completed steps to localStorage
    if (user) {
      localStorage.setItem(`completedSteps_${user.uid}`, JSON.stringify(newCompletedSteps));
    }
    
    // Move to next step
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding complete
      completeOnboarding();
      toast({
        title: "Onboarding Complete!",
        description: "You've completed all steps. Start trading now!",
      });
    }
  };

  const handleStepAction = (stepId: number) => {
    // In a real app, this would navigate to the appropriate page or show a form
    switch (stepId) {
      case 1:
        // Welcome - just move to next step
        handleStepComplete(stepId);
        break;
      case 2:
        // Profile setup
        router.push('/profile');
        handleStepComplete(stepId);
        break;
      case 3:
        // Payment methods
        router.push('/payment-methods');
        handleStepComplete(stepId);
        break;
      case 4:
        // Trading guide
        setActiveTab('learn');
        handleStepComplete(stepId);
        break;
      case 5:
        // Enable 2FA
        router.push('/security');
        handleStepComplete(stepId);
        break;
      default:
        handleStepComplete(stepId);
    }
  };

  const dismissOnboarding = () => {
    completeOnboarding();
    toast({
      title: "Onboarding dismissed",
      description: "You can restart the onboarding from your profile settings anytime.",
      variant: "default"
    });
  };

  // If no user or onboarding shouldn't be shown, don't render
  if (!user || !showOnboarding) {
    return null;
  }

  return (
    <Dialog open={showOnboarding} onOpenChange={(open) => !open && dismissOnboarding()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Get Started with CoinBox</DialogTitle>
          <DialogDescription>
            Complete these steps to set up your account and start trading
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2">
          <Progress value={onboardingProgress} className="h-2" />
          <p className="text-xs text-right mt-1 text-muted-foreground">{onboardingProgress}% complete</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="guide">Setup Guide</TabsTrigger>
            <TabsTrigger value="learn">Learn</TabsTrigger>
            <TabsTrigger value="tips">Pro Tips</TabsTrigger>
          </TabsList>
          
          <TabsContent value="guide" className="space-y-4">
            <div className="space-y-4 max-h-[400px] overflow-auto p-2">
              {onboardingSteps.map((step, index) => (
                <Card key={step.id} className={index === currentStep ? "border-primary" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                        completedSteps.includes(step.id) ? "bg-green-500 text-white" : "bg-muted"
                      }`}>
                        {completedSteps.includes(step.id) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <span>{step.id}</span>
                        )}
                      </div>
                      <CardTitle className="text-base font-medium">{step.title}</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                  {index === currentStep && (
                    <>
                      <CardContent>
                        <p className="text-sm">{step.content}</p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          size="sm" 
                          variant={index === currentStep ? "default" : "outline"}
                          onClick={() => handleStepAction(step.id)}
                          className="ml-auto"
                        >
                          {step.action} <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="learn" className="space-y-4">
            <div className="space-y-4 max-h-[400px] overflow-auto p-2">
              {educationalContent.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base font-medium">{item.title}</CardTitle>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                        item.difficulty === 'Intermediate' ? 'bg-blue-100 text-blue-800' : 
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.difficulty}
                      </span>
                    </div>
                    <CardDescription className="text-xs">
                      {item.reading} reading time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{item.content}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button size="sm" variant="outline">
                      <BookOpen className="mr-2 h-4 w-4" /> Read Article
                    </Button>
                    <Button size="sm" variant="outline">
                      <Play className="mr-2 h-4 w-4" /> Watch Video
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="tips" className="space-y-4">
            <div className="space-y-4 max-h-[400px] overflow-auto p-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                    <CardTitle className="text-base">Best Trading Times</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">The platform typically has more activity during weekdays, especially between 10 AM and 6 PM local time. This increases your chances of finding good trade matches.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-2 text-blue-500" />
                    <CardTitle className="text-base">Reputation Matters</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Trading with users who have high reputation scores reduces your risk. Initially, consider smaller trades until you've built your own reputation score.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    <CardTitle className="text-base">Security First</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Never share your password or 2FA codes with anyone, including support staff. All legitimate transactions happen through the platform's escrow system.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" size="sm" onClick={dismissOnboarding}>
            Skip for now
          </Button>
          <Button 
            type="submit" 
            size="sm" 
            onClick={() => handleStepAction(onboardingSteps[currentStep].id)}
          >
            {onboardingSteps[currentStep].action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
