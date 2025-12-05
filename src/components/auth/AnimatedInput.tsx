'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useState, forwardRef, InputHTMLAttributes } from 'react';

interface AnimatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  showPasswordToggle?: boolean;
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, success, showPasswordToggle, type, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputType = showPasswordToggle && showPassword ? 'text' : type;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-2"
      >
        {label && (
          <Label className="text-slate-700 dark:text-slate-300 font-medium">
            {label}
          </Label>
        )}
        
        <div className="relative">
          <motion.div
            animate={{
              scale: isFocused ? 1.02 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <Input
              ref={ref}
              type={inputType}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                'transition-all duration-200',
                isFocused && 'ring-2 ring-blue-500/50 dark:ring-blue-400/50 border-blue-500 dark:border-blue-400',
                error && 'border-red-500 dark:border-red-400 focus:ring-red-500/50',
                success && 'border-green-500 dark:border-green-400 focus:ring-green-500/50',
                'bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm',
                className
              )}
              {...props}
            />
          </motion.div>

          {showPasswordToggle && (
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </motion.button>
          )}

          {(error || success) && (
            <motion.div
              className="absolute right-3 top-1/2 -translate-y-1/2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {error && <XCircle className="w-4 h-4 text-red-500" />}
              {success && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';
