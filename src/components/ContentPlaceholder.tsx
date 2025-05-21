'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonLoader, SkeletonGroup } from './SkeletonLoader';
import { colors } from '@/styles/designTokens';

interface ContentPlaceholderProps {
  type: 'card' | 'list' | 'table' | 'dashboard' | 'profile';
  count?: number;
  className?: string;
}

/**
 * ContentPlaceholder Component
 * 
 * A sophisticated skeleton loading placeholder for different content types
 * with staggered animations, designed to match the app's visual style.
 * 
 * @example
 * <ContentPlaceholder type="card" count={3} />
 */
export default function ContentPlaceholder({
  type,
  count = 1,
  className = ''
}: ContentPlaceholderProps) {
  // Animation variants for container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };
  
  // Animation variants for individual items
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };
  
  const renderContent = () => {
    switch (type) {
      case 'card':
        return Array(count).fill(0).map((_, i) => (
          <motion.div key={i} variants={itemVariants} className="w-full">
            <CardPlaceholder />
          </motion.div>
        ));
        
      case 'list':
        return (
          <div className="w-full rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            {Array(count).fill(0).map((_, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants} 
                className={`p-4 ${i !== count - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <ListItemPlaceholder />
              </motion.div>
            ))}
          </div>
        );
        
      case 'table':
        return (
          <div className="w-full rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            <motion.div 
              variants={itemVariants}
              className="bg-gray-50 p-4 border-b border-gray-100"
            >
              <TableHeaderPlaceholder />
            </motion.div>
            {Array(count).fill(0).map((_, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                className={`p-4 ${i !== count - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <TableRowPlaceholder />
              </motion.div>
            ))}
          </div>
        );
        
      case 'dashboard':
        return <DashboardPlaceholder />;
        
      case 'profile':
        return <ProfilePlaceholder />;
        
      default:
        return Array(count).fill(0).map((_, i) => (
          <motion.div key={i} variants={itemVariants} className="w-full">
            <CardPlaceholder />
          </motion.div>
        ));
    }
  };
  
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`w-full space-y-4 ${className}`}
    >
      {renderContent()}
    </motion.div>
  );
}

function CardPlaceholder() {
  return (
    <div className="p-5 rounded-lg border border-gray-100 shadow-sm bg-white">
      <SkeletonGroup>
        <SkeletonLoader width="60%" height="1.5rem" className="mb-4" />
        <SkeletonLoader width="100%" height="0.875rem" className="mb-2" />
        <SkeletonLoader width="90%" height="0.875rem" className="mb-2" />
        <SkeletonLoader width="80%" height="0.875rem" className="mb-4" />
        <div className="flex justify-between items-center mt-4">
          <SkeletonLoader width="30%" height="2rem" rounded="lg" />
          <SkeletonLoader width="20%" height="1.5rem" rounded="full" />
        </div>
      </SkeletonGroup>
    </div>
  );
}

function ListItemPlaceholder() {
  return (
    <div className="flex items-center space-x-4">
      <SkeletonLoader width="2.5rem" height="2.5rem" rounded="full" />
      <div className="flex-grow">
        <SkeletonGroup>
          <SkeletonLoader width="40%" height="1rem" className="mb-2" />
          <SkeletonLoader width="70%" height="0.75rem" />
        </SkeletonGroup>
      </div>
      <SkeletonLoader width="4rem" height="1.5rem" rounded="md" />
    </div>
  );
}

function TableHeaderPlaceholder() {
  return (
    <div className="flex w-full space-x-4">
      <SkeletonLoader width="25%" height="1.25rem" className="bg-gray-300/70" />
      <SkeletonLoader width="25%" height="1.25rem" className="bg-gray-300/70" />
      <SkeletonLoader width="25%" height="1.25rem" className="bg-gray-300/70" />
      <SkeletonLoader width="25%" height="1.25rem" className="bg-gray-300/70" />
    </div>
  );
}

function TableRowPlaceholder() {
  return (
    <div className="flex w-full space-x-4">
      <SkeletonGroup>
        <SkeletonLoader width="25%" height="1rem" />
        <SkeletonLoader width="25%" height="1rem" />
        <SkeletonLoader width="25%" height="1rem" />
        <div className="w-[25%] flex justify-end">
          <SkeletonLoader width="80%" height="1.5rem" rounded="md" />
        </div>
      </SkeletonGroup>
    </div>
  );
}

function DashboardPlaceholder() {
  return (
    <div className="space-y-6">
      {/* Summary cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <motion.div key={i} variants={itemVariants} className="p-4 rounded-lg border border-gray-100 shadow-sm bg-white">
            <SkeletonGroup>
              <SkeletonLoader width="50%" height="0.875rem" className="mb-2" />
              <SkeletonLoader width="70%" height="2rem" className="mb-2" />
              <div className="flex justify-between items-center mt-2">
                <SkeletonLoader width="30%" height="0.75rem" />
                <SkeletonLoader width="15%" height="0.75rem" />
              </div>
            </SkeletonGroup>
          </motion.div>
        ))}
      </div>
      
      {/* Chart placeholder */}
      <motion.div variants={itemVariants} className="p-5 rounded-lg border border-gray-100 shadow-sm bg-white">
        <SkeletonGroup>
          <SkeletonLoader width="40%" height="1.25rem" className="mb-4" />
          <div className="h-[200px] w-full relative">
            <SkeletonLoader width="100%" height="100%" />
            
            {/* Chart visual elements */}
            <div className="absolute inset-0 flex items-end px-8 pb-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <SkeletonLoader 
                  key={i}
                  width="8%" 
                  height={`${20 + Math.random() * 60}%`} 
                  className="mx-[1%] bg-blue-200/40" 
                  rounded="sm"
                  delay={i * 0.05}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <SkeletonLoader key={i} width="8%" height="0.5rem" className="mx-[1%]" delay={i * 0.05} />
            ))}
          </div>
        </SkeletonGroup>
      </motion.div>
      
      {/* Table placeholder */}
      <motion.div variants={itemVariants} className="rounded-lg border border-gray-100 shadow-sm bg-white overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <SkeletonLoader width="30%" height="1.25rem" />
        </div>
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <TableHeaderPlaceholder />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className={`p-4 ${i !== 3 ? 'border-b border-gray-100' : ''}`}>
            <TableRowPlaceholder />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function ProfilePlaceholder() {
  return (
    <div className="space-y-6">
      {/* Header with avatar and name */}
      <div className="flex items-center space-x-4">
        <SkeletonLoader width="5rem" height="5rem" rounded="full" />
        <div className="flex-grow">
          <SkeletonGroup>
            <SkeletonLoader width="40%" height="1.5rem" className="mb-2" />
            <SkeletonLoader width="60%" height="1rem" className="mb-4" />
            <div className="flex space-x-2">
              <SkeletonLoader width="6rem" height="2rem" rounded="md" />
              <SkeletonLoader width="6rem" height="2rem" rounded="md" />
            </div>
          </SkeletonGroup>
        </div>
      </div>
      
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-100">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <SkeletonLoader width="50%" height="1.5rem" className="mx-auto mb-1" />
            <SkeletonLoader width="70%" height="0.75rem" className="mx-auto" />
          </div>
        ))}
      </div>
      
      {/* Content sections */}
      <div className="space-y-6">
        <div>
          <SkeletonLoader width="30%" height="1.25rem" className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-lg border border-gray-100">
                <SkeletonGroup>
                  <SkeletonLoader width="70%" height="1rem" className="mb-2" />
                  <SkeletonLoader width="100%" height="0.75rem" className="mb-1" />
                  <SkeletonLoader width="90%" height="0.75rem" className="mb-1" />
                  <SkeletonLoader width="50%" height="0.75rem" />
                </SkeletonGroup>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
