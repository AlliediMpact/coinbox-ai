'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PasswordStrengthProps {
  password: string;
}

interface StrengthCheck {
  label: string;
  test: (password: string) => boolean;
}

const strengthChecks: StrengthCheck[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains number', test: (p) => /[0-9]/.test(p) },
  { label: 'Contains special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    if (!password) {
      setStrength(0);
      return;
    }

    const passedChecks = strengthChecks.filter((check) => check.test(password)).length;
    setStrength(passedChecks);
  }, [password]);

  if (!password) return null;

  const strengthPercent = (strength / strengthChecks.length) * 100;
  const strengthColor =
    strengthPercent < 40
      ? 'bg-red-500'
      : strengthPercent < 70
      ? 'bg-yellow-500'
      : 'bg-green-500';

  const strengthText =
    strengthPercent < 40
      ? 'Weak'
      : strengthPercent < 70
      ? 'Medium'
      : 'Strong';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">Password Strength</span>
          <motion.span
            key={strengthText}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-medium"
          >
            {strengthText}
          </motion.span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${strengthColor} transition-colors duration-300`}
            initial={{ width: 0 }}
            animate={{ width: `${strengthPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-1.5">
        {strengthChecks.map((check, index) => {
          const passed = check.test(password);
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 text-xs"
            >
              <motion.div
                animate={{
                  scale: passed ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {passed ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                )}
              </motion.div>
              <span
                className={`${
                  passed
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {check.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
