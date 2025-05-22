'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { useOnboarding } from './OnboardingProvider';
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";

interface RestartOnboardingButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
}

export function RestartOnboardingButton({
  variant = 'outline',
  size = 'default',
  className = '',
  showIcon = true
}: RestartOnboardingButtonProps) {
  const { resetOnboarding, startOnboarding } = useOnboarding();
  const { toast } = useToast();

  const handleRestart = () => {
    resetOnboarding();
    startOnboarding();
    toast({
      title: "Onboarding restarted",
      description: "We'll guide you through the platform setup again.",
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleRestart}
    >
      {showIcon && <BookOpen className="h-4 w-4 mr-2" />}
      Restart Tutorial
    </Button>
  );
}
