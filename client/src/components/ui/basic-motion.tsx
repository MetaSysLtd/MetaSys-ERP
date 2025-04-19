import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useAnimation } from '@/contexts/AnimationContext';
import { cn } from '@/lib/utils';

interface BasicMotionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale';
  delay?: number;
  duration?: number;
}

export function BasicMotion({
  children,
  className,
  animation = 'fade',
  delay = 0,
  duration = 0.5,
}: BasicMotionProps) {
  const { animationsEnabled, reducedMotion } = useAnimation();
  
  // If animations are disabled or reduced motion preference is set, return children without animation
  if (!animationsEnabled || reducedMotion) {
    return <div className={className}>{children}</div>;
  }
  
  let initial = {};
  let animate = {};
  
  // Define animation variants
  switch (animation) {
    case 'fade':
      initial = { opacity: 0 };
      animate = { opacity: 1 };
      break;
    case 'slide-up':
      initial = { opacity: 0, y: 20 };
      animate = { opacity: 1, y: 0 };
      break;
    case 'slide-down':
      initial = { opacity: 0, y: -20 };
      animate = { opacity: 1, y: 0 };
      break;
    case 'slide-left':
      initial = { opacity: 0, x: -20 };
      animate = { opacity: 1, x: 0 };
      break;
    case 'slide-right':
      initial = { opacity: 0, x: 20 };
      animate = { opacity: 1, x: 0 };
      break;
    case 'scale':
      initial = { opacity: 0, scale: 0.95 };
      animate = { opacity: 1, scale: 1 };
      break;
    default:
      initial = { opacity: 0 };
      animate = { opacity: 1 };
  }
  
  return (
    <motion.div
      className={cn(className)}
      initial={initial}
      animate={animate}
      transition={{
        duration,
        delay
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredMotion({
  children,
  className,
  staggerDelay = 0.1,
  initialDelay = 0,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}) {
  const { animationsEnabled, reducedMotion } = useAnimation();
  
  if (!animationsEnabled || reducedMotion) {
    return <div className={className}>{children}</div>;
  }
  
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: initialDelay + (index * staggerDelay),
            duration: 0.5
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}