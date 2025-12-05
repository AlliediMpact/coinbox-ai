'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface AnimatedAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  className?: string;
}

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200',
  error: 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200',
  warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-200',
  info: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200',
};

export default function AnimatedAlert({ type, message, className }: AnimatedAlertProps) {
  const Icon = iconMap[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, type: 'spring' }}
    >
      <Alert className={cn('border-l-4', colorMap[type], className)}>
        <Icon className="w-4 h-4" />
        <AlertDescription className="ml-2">{message}</AlertDescription>
      </Alert>
    </motion.div>
  );
}
