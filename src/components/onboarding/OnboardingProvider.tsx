'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface OnboardingContextType {
  showOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  onboardingProgress: number;
  updateProgress: (progress: number) => void;
  isOnboardingCompleted: boolean;
  startOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingProgress, setOnboardingProgress] = useState(0);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);

  useEffect(() => {
    // Check if user is logged in and has not completed onboarding
    if (user) {
      const completed = localStorage.getItem(`onboarding_completed_${user.uid}`);
      const progress = localStorage.getItem(`onboarding_progress_${user.uid}`);
      const steps = localStorage.getItem(`completedSteps_${user.uid}`);
      
      // Set onboarding completion state
      if (completed) {
        setIsOnboardingCompleted(true);
        setShowOnboarding(false);
      } else {
        setIsOnboardingCompleted(false);
        setShowOnboarding(true);
      }
      
      // Restore progress if available
      if (progress) {
        setOnboardingProgress(parseInt(progress, 10));
      } else if (steps) {
        // If we have steps but no progress, calculate it
        try {
          const completedSteps = JSON.parse(steps);
          // Assuming we have a total of 5 steps from the UserOnboarding component
          const calculatedProgress = Math.round((completedSteps.length / 5) * 100);
          setOnboardingProgress(calculatedProgress);
          localStorage.setItem(`onboarding_progress_${user.uid}`, calculatedProgress.toString());
        } catch (e) {
          console.error("Error parsing completed steps", e);
        }
      }
    }
  }, [user]);

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.uid}`, 'true');
      localStorage.setItem(`onboarding_progress_${user.uid}`, '100');
      setShowOnboarding(false);
      setOnboardingProgress(100);
      setIsOnboardingCompleted(true);
    }
  };

  const resetOnboarding = () => {
    if (user) {
      localStorage.removeItem(`onboarding_completed_${user.uid}`);
      localStorage.removeItem(`onboarding_progress_${user.uid}`);
      localStorage.removeItem(`completedSteps_${user.uid}`);
      setShowOnboarding(true);
      setOnboardingProgress(0);
      setIsOnboardingCompleted(false);
    }
  };

  const startOnboarding = () => {
    if (user) {
      setShowOnboarding(true);
      setIsOnboardingCompleted(false);
      // Don't reset progress if they've already started
      if (onboardingProgress === 0) {
        localStorage.removeItem(`onboarding_completed_${user.uid}`);
      }
    }
  };

  const updateProgress = (progress: number) => {
    if (user) {
      localStorage.setItem(`onboarding_progress_${user.uid}`, progress.toString());
      setOnboardingProgress(progress);
      
      // If progress is 100%, mark as completed
      if (progress >= 100) {
        completeOnboarding();
      }
    }
  };

  return (
    <OnboardingContext.Provider 
      value={{ 
        showOnboarding, 
        completeOnboarding, 
        resetOnboarding,
        onboardingProgress,
        updateProgress,
        isOnboardingCompleted,
        startOnboarding
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
