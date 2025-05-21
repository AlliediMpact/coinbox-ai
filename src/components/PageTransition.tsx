'use client';

import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { colors, animations } from '@/styles/designTokens';

interface PageTransitionProps {
  children: ReactNode;
}

// Animation variants for page transitions
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

const loaderVariants: Variants = {
  initial: {
    width: "0%"
  },
  animate: {
    width: "100%",
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  
  // Simulate page loading - in a real app, you might want to 
  // use Next.js Router events or React Query's loading states
  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 400); // Short timeout for demo purposes
    
    return () => clearTimeout(timeout);
  }, [pathname]);
  
  return (
    <>
      {/* Loading indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary"
            variants={loaderVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          />
        )}
      </AnimatePresence>
      
      {/* Page transition wrapper */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-screen"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
