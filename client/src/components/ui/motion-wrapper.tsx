import { motion } from "framer-motion";
import * as React from "react";

interface MotionWrapperProps {
  children: React.ReactNode;
  animation: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "zoom-in" | "zoom-out";
  delay?: number;
  className?: string;
}

export function MotionWrapper({
  children,
  animation,
  delay = 0,
  className,
}: MotionWrapperProps) {
  // Animation variants
  const variants = {
    "fade-up": {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    },
    "fade-down": {
      hidden: { opacity: 0, y: -20 },
      visible: { opacity: 1, y: 0 }
    },
    "fade-left": {
      hidden: { opacity: 0, x: 20 },
      visible: { opacity: 1, x: 0 }
    },
    "fade-right": {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 }
    },
    "zoom-in": {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { opacity: 1, scale: 1 }
    },
    "zoom-out": {
      hidden: { opacity: 0, scale: 1.1 },
      visible: { opacity: 1, scale: 1 }
    }
  };
  
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={variants[animation]}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}