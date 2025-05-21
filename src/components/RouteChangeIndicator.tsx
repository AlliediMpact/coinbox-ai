'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, Variants, useAnimation } from 'framer-motion';
import { colors, animations } from "@/styles/designTokens";

// Animation variants with enhanced transitions
const progressContainerVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: -10
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.3,
      ease: animations.easings.easeOut
    }
  },
  exit: {
    opacity: 0,
    transition: { 
      duration: 0.3,
      delay: 0.2
    }
  }
};

// Enhanced pulse animation with better visual feedback
const pulseVariants: Variants = {
  initial: { 
    opacity: 0, 
    width: "15%",
    x: "-100%" 
  },
  animate: {
    opacity: [0.4, 0.7, 0.4],
    width: ["15%", "30%", "15%"],
    x: ["-50%", "100%", "250%"],
    transition: { 
      duration: 1.5,
      repeat: Infinity,
      repeatType: "loop",
      ease: "easeInOut"
    }
  }
};

/**
 * RouteChangeIndicator Component
 * 
 * Provides visual feedback during route navigation with sophisticated animations,
 * including realistic progress simulation and smooth transitions.
 */
export default function RouteChangeIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const previousPathnameRef = useRef(pathname);
  const previousSearchParamsRef = useRef(searchParams);
  const controls = useAnimation();
  
  useEffect(() => {
    // Only trigger loading state if the route actually changes
    const searchParamsString = searchParams?.toString();
    const previousSearchParamsString = previousSearchParamsRef.current?.toString();
    
    if (pathname !== previousPathnameRef.current || searchParamsString !== previousSearchParamsString) {
      // Update refs
      previousPathnameRef.current = pathname;
      previousSearchParamsRef.current = searchParams;
      
      // Show loading indicator with simulated progress
      setIsLoading(true);
      setProgress(0);
      
      // Start with a quick jump to show immediate feedback
      setTimeout(() => setProgress(10), 50);
      
      let progressInterval: NodeJS.Timeout;
      let progressStages = [
        { target: 30, speed: 12, threshold: 15 },
        { target: 60, speed: 7, threshold: 40 },
        { target: 85, speed: 3, threshold: 70 },
        { target: 95, speed: 1, threshold: 90 }
      ];
      
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          // Find the current stage based on progress
          const stage = progressStages.find(s => prev < s.threshold) || progressStages[progressStages.length - 1];
          
          // Calculate next progress value with variable speed
          let increment = ((stage.target - prev) * stage.speed / 100);
          increment = Math.max(0.2, increment); // Minimum increment
          
          const next = prev + increment;
          return next >= 99 ? 99 : next;
        });
      }, 80);
      
      // Complete the progress after a reasonable delay
      const timeout = setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(100);
        
        // Fade out after reaching 100%
        setTimeout(() => setIsLoading(false), 300);
      }, 800);
      
      return () => {
        clearTimeout(timeout);
        clearInterval(progressInterval);
      };
    }
  }, [pathname, searchParams]);
  
  // SVG path for the glow effect
  const glowPath = `M0 0 L${progress} 0`;
  
  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div 
          key="progress-indicator"
          variants={progressContainerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className="relative w-full">
            {/* Enhanced progress bar with dynamic glow effect */}
            <div className="w-full h-[2px] bg-gray-100/80 overflow-hidden shadow-sm">
              <div className="relative h-full w-full">
                {/* Main progress bar with gradient */}
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-400"
                  style={{ 
                    width: `${progress}%`,
                    boxShadow: '0 0 8px rgba(91, 33, 182, 0.6)'
                  }}
                  initial={{ width: "0%" }}
                  animate={{ 
                    width: `${progress}%`,
                    transition: { 
                      ease: [0.34, 1.56, 0.64, 1] // Custom spring-like easing
                    }
                  }}
                />
                
                {/* Animated pulse effect */}
                <motion.div 
                  className="absolute top-0 h-full bg-gradient-to-r from-transparent via-white/80 to-transparent"
                  variants={pulseVariants}
                  initial="initial"
                  animate="animate"
                />
              </div>
            </div>
            
            {/* Subtle glow under the bar */}
            <motion.div 
              className="h-1 w-full bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.4, 0.7, 0.4],
                transition: {
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }
              }}
              exit={{ opacity: 0 }}
            />
            
            {/* Interactive dots that follow progress */}
            {progress > 30 && (
              <div className="absolute top-0 right-0 p-1.5">
                <motion.div
                  className="w-1 h-1 rounded-full bg-purple-500"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0.8, 1.2, 0.8], 
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut"
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
