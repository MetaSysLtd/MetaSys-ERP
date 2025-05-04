import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAnimationContext } from '@/contexts/AnimationContext';

type AnimationType = 
  'fade' | 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' |
  'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale';

interface MotionWrapperProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

const animations = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  'fade-up': {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  'fade-down': {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  'fade-left': {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  'fade-right': {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
};

export function MotionWrapper({
  children,
  animation = 'fade',
  delay = 0,
  duration = 0.3,
  className,
  once = true,
}: MotionWrapperProps) {
  const { animationsEnabled } = useAnimationContext();
  
  // If animations are disabled, just render children
  if (!animationsEnabled) {
    return <div className={className}>{children}</div>;
  }
  
  // TypeScript needs this explicit cast to ensure property access works
  const animationProps = animations[animation as keyof typeof animations] || animations.fade;
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={animationProps}
      transition={{ 
        duration, 
        delay,
        ease: 'easeOut'
      }}
      className={className}
      viewport={{ once }}
    >
      {children}
    </motion.div>
  );
}