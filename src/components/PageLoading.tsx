'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { colors } from '@/styles/designTokens';

interface PageLoadingProps {
  message?: string;
  showAfterDelay?: boolean;
  showTips?: boolean;
}

// Animation variants for main container
const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.1,
      duration: 0.3,
      when: "beforeChildren",
      staggerChildren: 0.15
    }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.25,
      ease: "easeInOut",
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

// Background glow animation
const glowVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8
  },
  visible: {
    opacity: 0.08,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3
    }
  }
};

// Spinner container animation
const spinnerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  },
  exit: {
    opacity: 0,
    scale: 1.1,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
};

// Outer ring animation
const ringVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.7,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

// Inner spinner animation
const circleVariants: Variants = {
  spin: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 3,
      ease: [0.5, 0.15, 0.25, 0.85] // Custom easing for more organic motion
    }
  }
};

// Middle spinner animation (opposite direction)
const middleCircleVariants: Variants = {
  spin: {
    rotate: -360,
    transition: {
      repeat: Infinity,
      duration: 2.5,
      ease: [0.5, 0.15, 0.25, 0.85]
    }
  }
};

// Text message animation
const textVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      delay: 0.1
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2
    }
  }
};

// Dots animation for ellipsis
const dotVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 5
  },
  visible: (custom) => ({
    opacity: [0, 1, 0],
    y: [5, 0, 5],
    transition: {
      delay: custom * 0.2,
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  })
};

// Reflection/highlights animation
const reflectionVariants: Variants = {
  hidden: { 
    opacity: 0,
    rotate: -30,
    scale: 0.7 
  },
  visible: { 
    opacity: [0, 0.5, 0],
    rotate: [0, 180, 360],
    scale: 1,
    transition: { 
      duration: 3.5, 
      repeat: Infinity,
      ease: "linear" 
    }
  }
};

// Tips for users to see while content is loading
const loadingTips = [
  "You can compare membership tiers to find the best fit for your needs",
  "Try sharing your referral code with friends to earn rewards",
  "Check notifications regularly for important updates",
  "Higher tier memberships offer more benefits and lower fees",
  "You can track all referral activity from your dashboard",
  "Consider enabling MFA for additional account security"
];

export default function PageLoading({ 
  message = 'Loading content', 
  showAfterDelay = true,
  showTips = true
}: PageLoadingProps) {
  const [currentTip, setCurrentTip] = useState(0);
  const [showTip, setShowTip] = useState(false);

  // Show tips after a delay if content is still loading
  useEffect(() => {
    if (showTips) {
      const tipTimer = setTimeout(() => {
        setShowTip(true);
      }, 2000);
      
      const rotationTimer = setInterval(() => {
        setCurrentTip(prev => (prev + 1) % loadingTips.length);
      }, 5000);
      
      return () => {
        clearTimeout(tipTimer);
        clearInterval(rotationTimer);
      };
    }
  }, [showTips]);
  
  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial={showAfterDelay ? "hidden" : false}
        animate="visible"
        exit="exit"
        className="flex flex-col items-center justify-center min-h-[300px] py-12 px-4 relative"
      >
        {/* Background glow effect */}
        <motion.div
          variants={glowVariants}
          className="absolute inset-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 blur-3xl"
        />
        
        {/* Spinner with multiple layers for visual interest */}
        <motion.div 
          variants={spinnerContainerVariants}
          className="relative mb-8"
        >
          <div className="relative h-16 w-16">
            {/* Outer animated ring */}
            <motion.div 
              variants={ringVariants}
              className="absolute inset-[-8px] rounded-full border-2 border-transparent"
              style={{ 
                background: `linear-gradient(white, white) padding-box, ${colors.primary.gradient} border-box`,
                opacity: 0.7
              }}
            />
            
            {/* Pulsing glow effect */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/10 to-purple-500/10 blur-md"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Outer spinning circle */}
            <motion.div 
              variants={circleVariants}
              animate="spin"
              className="absolute inset-0 border-2 rounded-full"
              style={{ 
                borderColor: `${colors.primary.blue}1A`,
                borderTopColor: colors.primary.blue,
                borderRightColor: colors.primary.purple
              }}
            />
            
            {/* Middle spinning circle (opposite direction) */}
            <motion.div 
              variants={middleCircleVariants}
              animate="spin"
              className="absolute inset-[3px] border-2 rounded-full"
              style={{ 
                borderColor: `${colors.primary.purple}1A`,
                borderBottomColor: colors.primary.purple,
                borderLeftColor: colors.primary.blue
              }}
            />
            
            {/* Inner static circle with gradient */}
            <div className="absolute inset-[6px] rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50" />
              
              {/* Moving reflection/highlight */}
              <motion.div
                variants={reflectionVariants}
                animate="visible"
                className="absolute w-8 h-8 bg-gradient-to-r from-white/0 via-white/80 to-white/0 blur-sm transform rotate-45 -translate-x-4"
              />
              
              {/* Center icon or logo */}
              <div className="relative w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <div className="absolute inset-1 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Loading message with animated dots */}
        <motion.div 
          variants={textVariants} 
          className="relative flex flex-col items-center text-center"
        >
          <div className="flex items-center space-x-1 mb-1">
            <p 
              className="text-sm font-medium bg-clip-text text-transparent"
              style={{ 
                backgroundImage: `linear-gradient(to right, ${colors.primary.blue}, ${colors.primary.purple})` 
              }}
            >
              {message}
            </p>
            {[0, 1, 2].map((i) => (
              <motion.span 
                key={i}
                variants={dotVariants}
                custom={i}
                initial="hidden"
                animate="visible"
                className="text-lg font-bold"
                style={{ color: colors.primary.purple }}
              >
                .
              </motion.span>
            ))}
          </div>
          
          {/* Tips that appear after delay */}
          {showTip && (
            <motion.p
              key={currentTip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.8, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-xs text-gray-500 max-w-xs text-center mt-4 px-4"
            >
              <span className="text-xs font-medium" style={{ color: colors.primary.blue }}>TIP:</span> {loadingTips[currentTip]}
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Smaller version for inline use cases, enhanced with better animations and design
export function InlineLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center space-x-3 p-2">
      <div className="relative">
        {/* Subtle background glow */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0.2, 0.5, 0.2], 
            scale: [0.8, 1, 0.8] 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.5,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full bg-blue-400/10 blur-sm"
        />
        
        {/* Outer spinner */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.5,
            ease: [0.5, 0.15, 0.25, 0.85]
          }}
          style={{ borderRightColor: colors.primary.blue, borderTopColor: colors.primary.purple }}
          className="w-4 h-4 border-[1.5px] border-transparent rounded-full"
        />
        
        {/* Inner spinner (opposite direction) */}
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            ease: [0.5, 0.15, 0.25, 0.85]
          }}
          className="absolute inset-[1px] w-2 h-2 border-[1px] rounded-full"
          style={{ 
            borderColor: `${colors.primary.purple}33`,
            borderBottomColor: colors.primary.purple,
            borderLeftColor: colors.primary.blue
          }}
        />
      </div>
      
      {message && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-xs font-medium bg-clip-text text-transparent"
          style={{ 
            backgroundImage: `linear-gradient(to right, ${colors.primary.blue}, ${colors.primary.purple})` 
          }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
