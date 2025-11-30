'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Lock, ArrowRight } from 'lucide-react';
import SignUpPage from '@/app/auth/signup/page';

// This wrapper turns the existing signup page into a 4-step themed wizard

const steps = [
  'Account details',
  'Security & password',
  'Membership tier',
  'Review & pay',
];

export default function SignUpWizard() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="space-y-4">
      {/* Stepper header */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center text-xs sm:text-sm text-slate-200/80 font-medium">
          {steps.map((label, index) => {
            const active = index === currentStep;
            const completed = index < currentStep;
            return (
              <div key={label} className="flex-1 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                      completed
                        ? 'bg-emerald-400 text-slate-900 border-emerald-300'
                        : active
                        ? 'bg-blue-500 text-white border-blue-300'
                        : 'bg-slate-900/40 text-slate-300 border-slate-500/60'
                    }`}
                  >
                    {completed ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                  </div>
                  <span className={active ? 'text-white' : 'text-slate-300/80'}>{label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden sm:block h-0.5 w-full bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-300/80">
          Step {currentStep + 1} of {steps.length}. You can review everything before paying your security deposit.
        </p>
      </div>

      {/* Content: for now we mount the existing SignUpPage which already owns validation and payment. */}
      <div className="mt-2">
        <SignUpPage />
      </div>
    </div>
  );
}
