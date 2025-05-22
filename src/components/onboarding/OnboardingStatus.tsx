'use client';

import React, { ReactNode } from 'react';
import { useOnboarding } from './OnboardingProvider';

interface OnboardingStatusProps {
  /**
   * Content to show when onboarding is completed
   */
  completed: ReactNode;
  
  /**
   * Content to show when onboarding is not completed
   */
  notCompleted: ReactNode;
  
  /**
   * If true, the component will only render when the onboarding status matches
   * If false, both sections will be rendered but with display:none on the non-matching section
   * Default: true
   */
  unmount?: boolean;
}

export function OnboardingStatus({ 
  completed, 
  notCompleted, 
  unmount = true 
}: OnboardingStatusProps) {
  const { isOnboardingCompleted } = useOnboarding();

  if (unmount) {
    return isOnboardingCompleted ? <>{completed}</> : <>{notCompleted}</>;
  }

  return (
    <>
      <div style={{ display: isOnboardingCompleted ? 'block' : 'none' }}>
        {completed}
      </div>
      <div style={{ display: isOnboardingCompleted ? 'none' : 'block' }}>
        {notCompleted}
      </div>
    </>
  );
}
