import React, { ReactNode } from 'react';
import { motion, AnimatePresence, Variants, MotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAnimation } from '@/contexts/AnimationContext';

/**
 * Transition presets for different animation types
 */
export const transitions = {
  smooth: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },
  subtle: {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3,
  },
  snap: {
    type: "spring",
    stiffness: 500,
    damping: 40,
  },
  bounce: {
    type: "spring",
    stiffness: 300,
    damping: 10,
  },
};

/**
 * Animation variant presets for common use cases
 */
export const animations = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  staggerItems: {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
      },
    }),
  },
  pulse: {
    hidden: { scale: 1 },
    visible: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "loop",
      },
    },
  },
  shakeX: {
    hidden: { x: 0 },
    visible: {
      x: [0, -10, 10, -5, 5, 0],
      transition: {
        duration: 0.5,
      },
    },
  },
};

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  animation?: keyof typeof animations | Variants;
  transition?: keyof typeof transitions | Record<string, any>;
  delay?: number;
  duration?: number;
  as?: React.ElementType;
  containerRef?: React.RefObject<HTMLElement>;
  staggerIndex?: number; // For items in a list, their position for staggered animations
}

/**
 * AnimatedContainer is a reusable component that wraps content with animations
 * powered by Framer Motion.
 */
export function AnimatedContainer({
  children,
  className,
  animation = "fadeIn",
  transition = "subtle",
  delay = 0,
  duration,
  as: Component = motion.div,
  containerRef,
  staggerIndex,
  ...rest
}: AnimatedContainerProps) {
  const { animationsEnabled, reducedMotion, getDuration } = useAnimation();
  
  // Respect user preferences
  if (!animationsEnabled || reducedMotion) {
    return <div className={className}>{children}</div>;
  }
  
  // Get the animation variants
  const variants = typeof animation === "string" && animation in animations 
    ? animations[animation as keyof typeof animations]
    : animation;
  
  // Get the transition settings
  const transitionSettings = 
    typeof transition === "string" && transition in transitions
      ? transitions[transition as keyof typeof transitions] 
      : transition;
  
  // Add delay and duration to transition if specified
  const finalTransition = {
    ...transitionSettings,
    delay: delay || 0,
    ...(duration ? { duration } : {}),
  };
  
  return (
    <Component
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={variants}
      custom={staggerIndex}
      transition={finalTransition}
      className={className}
      ref={containerRef}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * AnimatedList is a specialized variant of AnimatedContainer
 * designed specifically for rendering animated lists with staggered children
 */
export function AnimatedList({
  children,
  className,
  transition = "subtle",
  delay = 0,
  ...rest
}: AnimatedContainerProps) {
  return (
    <AnimatedContainer
      animation="container"
      transition={transition}
      delay={delay}
      className={className}
      {...rest}
    >
      {children}
    </AnimatedContainer>
  );
}

/**
 * AnimatedListItem is a specialized variant of AnimatedContainer
 * designed to be used as a child of AnimatedList
 */
export function AnimatedListItem({
  children,
  className,
  staggerIndex = 0,
  ...rest
}: AnimatedContainerProps) {
  return (
    <AnimatedContainer
      animation="staggerItems"
      staggerIndex={staggerIndex}
      className={className}
      {...rest}
    >
      {children}
    </AnimatedContainer>
  );
}

/**
 * AnimatedCard is a specialized variant of AnimatedContainer
 * designed for card elements with container animations
 */
export function AnimatedCard({
  children,
  className,
  animation = "scaleIn",
  ...rest
}: AnimatedContainerProps) {
  return (
    <AnimatedContainer
      animation={animation}
      className={cn("rounded-lg", className)}
      {...rest}
    >
      {children}
    </AnimatedContainer>
  );
}

/**
 * AnimatedWrapper is a simple wrapper that applies animations
 * without adding any styling
 */
export function AnimatedWrapper({
  children,
  animation = "fadeIn",
  ...rest
}: AnimatedContainerProps) {
  return (
    <AnimatedContainer
      animation={animation}
      {...rest}
    >
      {children}
    </AnimatedContainer>
  );
}