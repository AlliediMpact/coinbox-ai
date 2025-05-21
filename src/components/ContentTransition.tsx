'use client';

import { ReactNode } from 'react';
import { motion, Variants, HTMLMotionProps } from 'framer-motion';

interface ContentTransitionProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  delay?: number;
  stagger?: number;
}

// Animation variants for content elements
const contentVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom.delay || 0,
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

// Animation variants for container with staggered children
const containerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: (custom) => ({
    opacity: 1,
    transition: {
      delay: custom.delay || 0,
      staggerChildren: custom.stagger || 0.1,
      when: "beforeChildren"
    }
  })
};

export function ContentTransition({ 
  children, 
  delay = 0, 
  stagger = 0.1,
  ...props 
}: ContentTransitionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={contentVariants}
      custom={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredContentTransition({ 
  children, 
  delay = 0, 
  stagger = 0.1,
  ...props
}: ContentTransitionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      custom={{ delay, stagger }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredItem({ 
  children,
  ...props
}: { children: ReactNode } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
          }
        }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Page section fade-in animation
export function SectionFade({ 
  children,
  direction = "up",
  distance = 20,
  ...props
}: ContentTransitionProps & { 
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
}) {
  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance }
  };
  
  return (
    <motion.section
      initial={{ 
        opacity: 0,
        ...directionMap[direction]
      }}
      whileInView={{ 
        opacity: 1,
        y: 0,
        x: 0,
        transition: {
          duration: 0.5,
          ease: "easeOut"
        }
      }}
      viewport={{ once: true, margin: "-100px" }}
      {...props}
    >
      {children}
    </motion.section>
  );
}
