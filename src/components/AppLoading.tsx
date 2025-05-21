'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { colors } from '@/styles/designTokens';

interface AppLoadingProps {
  minimumLoadTimeMs?: number;
}

// Animation variants
const containerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
      ease: "easeOut",
      duration: 0.5
    }
  }
};

const backgroundVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 1.1
  },
  visible: {
    opacity: 0.4,
    scale: 1,
    transition: {
      duration: 1,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 1.1,
    transition: {
      duration: 0.4
    }
  }
};

const logoVariants: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
    y: 20
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15
    }
  },
  exit: {
    scale: 1.2,
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const progressVariants: Variants = {
  hidden: {
    width: "0%",
    opacity: 0
  },
  visible: {
    width: "100%",
    opacity: 1,
    transition: {
      duration: 1.5,
      ease: "easeInOut",
      delay: 0.3
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

const progressPulseVariants: Variants = {
  hidden: {
    opacity: 0,
    width: "5%"
  },
  visible: {
    opacity: [0, 0.5, 0],
    width: ["5%", "15%", "5%"],
    x: ["0%", "400%", "0%"],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop",
      times: [0, 0.5, 1]
    }
  }
};

const textVariants: Variants = {
  hidden: {
    y: 10,
    opacity: 0
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      delay: 0.5
    }
  },
  exit: {
    y: -10,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

const particleVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 0,
    x: 0
  },
  visible: (custom) => ({
    opacity: [0, 0.5, 0],
    y: [0, custom.y, custom.y * 2],
    x: [0, custom.x, custom.x * 2],
    transition: {
      duration: custom.duration,
      delay: custom.delay,
      repeat: Infinity,
      repeatType: "loop",
      ease: "easeOut"
    }
  })
};

const iconRingVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    rotate: -30
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      delay: 0.2
    }
  },
  exit: {
    opacity: 0,
    scale: 1.2,
    transition: {
      duration: 0.3
    }
  }
};

// Generate random particles with specific properties
const generateParticles = (count: number) => {
  return Array.from({ length: count }).map(() => ({
    x: (Math.random() - 0.5) * 200, // Random x direction
    y: Math.random() * -150, // Always move upward
    duration: 3 + Math.random() * 5, // Random duration between 3-8 seconds
    delay: Math.random() * 2, // Random delay for start
    size: 4 + Math.random() * 8, // Random size between 4-12px
  }));
};

export default function AppLoading({ minimumLoadTimeMs = 2500 }: AppLoadingProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing secure environment');
  const particles = generateParticles(12);
  
  useEffect(() => {
    const loadingTexts = [
      'Initializing secure environment',
      'Establishing encrypted connection',
      'Preparing financial data',
      'Loading user preferences',
      'Syncing with network',
      'Almost ready'
    ];
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (Math.random() * 15);
        return next > 100 ? 100 : next;
      });
    }, 400);
    
    // Update loading text periodically
    const textInterval = setInterval(() => {
      setLoadingText((prev) => {
        const currentIndex = loadingTexts.indexOf(prev);
        const nextIndex = (currentIndex + 1) % loadingTexts.length;
        return loadingTexts[nextIndex];
      });
    }, 2000);
    
    // Hide the loading screen after the minimum time
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, minimumLoadTimeMs);
    
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
      clearInterval(textInterval);
    };
  }, [minimumLoadTimeMs]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background elements */}
          <motion.div
            variants={backgroundVariants}
            className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50"
          />
          
          {/* Decorative particles */}
          {particles.map((particle, i) => (
            <motion.div
              key={i}
              custom={particle}
              variants={particleVariants}
              initial="hidden"
              animate="visible"
              className="absolute left-1/2 bottom-1/4"
              style={{
                width: particle.size,
                height: particle.size,
                borderRadius: '50%',
                background: `linear-gradient(to right, ${colors.primary.blue}, ${colors.primary.purple})`,
              }}
            />
          ))}
          
          <div className="flex flex-col items-center justify-center max-w-sm w-full px-6 z-10">
            <motion.div variants={logoVariants} className="mb-6 relative">
              {/* Logo with animated rings */}
              <div className="relative h-28 w-28">
                {/* Outer glow */}
                <motion.div 
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 opacity-20 blur-xl"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Animated outer ring */}
                <motion.div 
                  variants={iconRingVariants}
                  className="absolute inset-0 rounded-full border-4 border-blue-400/30"
                  style={{ borderRightColor: colors.primary.purple, borderTopColor: colors.primary.purple }}
                  animate={{ 
                    rotate: 360 
                  }}
                  transition={{ 
                    duration: 8, 
                    ease: "linear", 
                    repeat: Infinity 
                  }}
                />
                
                {/* Inner circle with logo */}
                <motion.div 
                  className="absolute inset-4 rounded-full bg-white flex items-center justify-center shadow-lg"
                  animate={{ 
                    boxShadow: [
                      '0 0 0 rgba(94, 23, 235, 0.1)', 
                      '0 0 20px rgba(94, 23, 235, 0.3)', 
                      '0 0 0 rgba(94, 23, 235, 0.1)'
                    ]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="url(#logoGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <defs>
                      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={colors.primary.blue} />
                        <stop offset="100%" stopColor={colors.primary.purple} />
                      </linearGradient>
                    </defs>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </motion.div>
                
                {/* Animated dots around the circle */}
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
                    style={{
                      top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * 50}px)`,
                      left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * 50}px)`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{ 
                      delay: i * 0.2,
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  />
                ))}
              </div>
            </motion.div>
            
            <motion.h1 
              variants={textVariants}
              className="text-2xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Allied iMpact Coin Box
            </motion.h1>
            
            <motion.p 
              variants={textVariants}
              className="text-sm text-gray-600 mb-8 text-center"
            >
              Secure peer-to-peer financial platform
            </motion.p>
            
            <div className="w-full max-w-xs h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner mb-2">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              />
              <motion.div 
                className="h-full bg-white/50 absolute top-0"
                variants={progressPulseVariants}
                initial="hidden"
                animate="visible"
              />
            </div>
            
            <motion.div 
              variants={textVariants}
              className="text-xs text-gray-500 h-6 flex items-center"
            >
              <motion.span
                key={loadingText}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {loadingText}
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5,
                    ease: "easeInOut"
                  }}
                >
                  ...
                </motion.span>
              </motion.span>
            </motion.div>
          </div>
          
          {/* Footer with copyright */}
          <motion.div
            variants={textVariants} 
            className="absolute bottom-4 text-xs text-gray-400 text-center"
          >
            © 2025 Allied iMpact • All Rights Reserved
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
