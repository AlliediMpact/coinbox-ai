'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  fullWidth?: boolean;
}

export default function AnimatedButton({
  loading = false,
  loadingText = 'Loading...',
  children,
  className,
  disabled,
  variant = 'default',
  fullWidth = true,
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={cn(fullWidth && 'w-full')}
    >
      <Button
        disabled={disabled || loading}
        variant={variant}
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
          'shadow-lg shadow-blue-500/25 dark:shadow-blue-500/10',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingText}
          </motion.span>
        ) : (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2"
          >
            {children}
          </motion.span>
        )}
      </Button>
    </motion.div>
  );
}
