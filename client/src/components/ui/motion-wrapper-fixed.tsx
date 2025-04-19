import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAnimation } from "@/contexts/AnimationContext";

type AnimationType = 
  | "fade-in" 
  | "fade-up" 
  | "fade-down" 
  | "fade-left" 
  | "fade-right" 
  | "scale-up" 
  | "scale-down" 
  | "bounce" 
  | "pulse";

interface MotionWrapperProps {
  children: ReactNode;
  className?: string;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  // For staggered animations
  index?: number;
}

// Type of repeat type for animations
type RepeatType = "loop" | "reverse" | "mirror" | undefined;

/**
 * A simple wrapper component that adds consistent animations to any component
 * while respecting user preferences for reduced motion and animation settings
 */
export function MotionWrapper({
  children,
  className,
  animation = "fade-in",
  delay = 0,
  duration,
  index = 0,
}: MotionWrapperProps) {
  const { animationsEnabled, reducedMotion } = useAnimation();
  
  const getAnimationProps = () => {
    // If animations are disabled or reduced motion preference is set, return empty props
    if (!animationsEnabled || reducedMotion) {
      return {};
    }
    
    const baseDelay = delay + (index * 0.1);
    const baseDuration = duration || 0.5;
    
    // Define animation variants
    switch (animation) {
      case "fade-in":
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { delay: baseDelay, duration: baseDuration }
        };
      case "fade-up":
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: baseDelay, duration: baseDuration }
        };
      case "fade-down":
        return {
          initial: { opacity: 0, y: -20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: baseDelay, duration: baseDuration }
        };
      case "fade-left":
        return {
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          transition: { delay: baseDelay, duration: baseDuration }
        };
      case "fade-right":
        return {
          initial: { opacity: 0, x: 20 },
          animate: { opacity: 1, x: 0 },
          transition: { delay: baseDelay, duration: baseDuration }
        };
      case "scale-up":
        return {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          transition: { 
            delay: baseDelay, 
            duration: baseDuration, 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }
        };
      case "scale-down":
        return {
          initial: { opacity: 0, scale: 1.1 },
          animate: { opacity: 1, scale: 1 },
          transition: { 
            delay: baseDelay, 
            duration: baseDuration, 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }
        };
      case "bounce":
        return {
          initial: { opacity: 0, y: -10 },
          animate: { opacity: 1, y: 0 },
          transition: { 
            delay: baseDelay, 
            duration: baseDuration, 
            type: "spring", 
            stiffness: 300, 
            damping: 10 
          }
        };
      case "pulse":
        return {
          initial: { opacity: 1, scale: 1 },
          animate: { 
            opacity: [1, 0.8, 1], 
            scale: [1, 1.02, 1]
          },
          transition: { 
            delay: baseDelay, 
            duration: 2, 
            repeat: Infinity, 
            repeatType: "loop" as RepeatType
          }
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { delay: baseDelay, duration: baseDuration }
        };
    }
  };
  
  // If animations are disabled, just render the children
  if (!animationsEnabled || reducedMotion) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <motion.div
      className={cn(className)}
      {...getAnimationProps()}
    >
      {children}
    </motion.div>
  );
}

/**
 * A container that animates its children in a staggered sequence
 */
export function MotionList({
  children,
  className,
  animation = "fade-up",
  delay = 0,
  duration = 0.5
}: Omit<MotionWrapperProps, 'index'>) {
  const { animationsEnabled, reducedMotion } = useAnimation();
  
  // If animations are disabled, just render the children
  if (!animationsEnabled || reducedMotion) {
    return <div className={className}>{children}</div>;
  }
  
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <MotionWrapper 
          key={index} 
          animation={animation} 
          delay={delay} 
          duration={duration}
          index={index}
        >
          {child}
        </MotionWrapper>
      ))}
    </div>
  );
}