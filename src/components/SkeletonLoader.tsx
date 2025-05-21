'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { colors } from '@/styles/designTokens';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animate?: boolean;
  delay?: number;
}

/**
 * SkeletonLoader Component
 * 
 * A customizable skeleton loading placeholder component with subtle animations.
 * Use this for content that is loading to provide users with visual feedback.
 */
export function SkeletonLoader({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = 'md',
  animate = true,
  delay = 0
}: SkeletonProps) {
  // Map the rounded prop to Tailwind CSS classes
  const roundedClassMap = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };
  
  const roundedClass = roundedClassMap[rounded];
  
  return (
    <div
      className={`overflow-hidden relative ${roundedClass} ${className}`}
      style={{ width, height }}
    >
      {/* Base skeleton background */}
      <div className="absolute inset-0 bg-gray-200/70"></div>
      
      {/* Animation shimmer effect */}
      {animate && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            repeatType: 'loop',
            duration: 1.5,
            ease: 'linear',
            delay
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
      )}
    </div>
  );
}

interface SkeletonGroupProps {
  children: React.ReactNode;
  staggerDelay?: number;
}

/**
 * SkeletonGroup Component
 * 
 * A container for multiple SkeletonLoader components that applies a staggered delay
 * to create a more pleasing visual effect.
 */
export function SkeletonGroup({ children, staggerDelay = 0.05 }: SkeletonGroupProps) {
  return (
    <div className="skeleton-group">
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<SkeletonProps>, {
            delay: index * staggerDelay,
          });
        }
        return child;
      })}
    </div>
  );
}

/**
 * Pre-configured skeleton components for common use cases
 */

export function TextRowSkeleton({ width = '100%', className = '' }: { width?: string | number, className?: string }) {
  return <SkeletonLoader width={width} height="1rem" className={`mb-2 ${className}`} />;
}

export function AvatarSkeleton({ size = '2.5rem', className = '' }: { size?: string | number, className?: string }) {
  return <SkeletonLoader width={size} height={size} rounded="full" className={className} />;
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 border border-gray-100 rounded-lg shadow-sm ${className}`}>
      <SkeletonGroup>
        <SkeletonLoader width="40%" height="1.5rem" className="mb-4" />
        <TextRowSkeleton />
        <TextRowSkeleton width="90%" />
        <TextRowSkeleton width="80%" />
        <div className="mt-4">
          <SkeletonLoader width="30%" height="2rem" rounded="lg" />
        </div>
      </SkeletonGroup>
    </div>
  );
}

export function TableRowSkeleton({ columnCount = 4 }: { columnCount?: number }) {
  return (
    <div className="flex w-full space-x-4 py-3">
      {Array(columnCount).fill(0).map((_, i) => (
        <SkeletonLoader 
          key={i}
          width={`${100 / columnCount}%`}
          height="1.2rem"
          delay={i * 0.05}
        />
      ))}
    </div>
  );
}

export default SkeletonLoader;
