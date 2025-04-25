import { motion } from "framer-motion";
import { ReactNode } from "react";

type AnimationType = "fade" | "fade-up" | "fade-down" | "fade-left" | "fade-right" | "fade-in" | "zoom" | "scale-up" | "slide-up" | "slide-down";

interface MotionWrapperProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
}

// Animation variants
const animations = {
  "fade": {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  "fade-in": {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  "fade-up": {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  "fade-down": {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  "fade-left": {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  "fade-right": {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  "zoom": {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  },
  "scale-up": {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  },
  "slide-up": {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" }
  },
  "slide-down": {
    initial: { y: "-100%" },
    animate: { y: 0 },
    exit: { y: "-100%" }
  }
};

export function MotionWrapper({
  children,
  animation = "fade",
  delay = 0,
  duration = 0.3,
  className = ""
}: MotionWrapperProps) {
  const animationProps = animations[animation];

  return (
    <motion.div 
      initial={animationProps.initial}
      animate={animationProps.animate}
      exit={animationProps.exit}
      transition={{ 
        duration, 
        delay,
        ease: [0.16, 1, 0.3, 1] // Custom ease for smoother animation
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}