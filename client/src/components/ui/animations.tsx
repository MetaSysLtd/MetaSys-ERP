import React, { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAnimation } from '@/contexts/AnimationContext';

interface FadeAnimationProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  show?: boolean;
}

export const FadeAnimation = ({ 
  children, 
  className,
  duration,
  delay = 0,
  show = true
}: FadeAnimationProps) => {
  const { getDuration, reducedMotion } = useAnimation();
  
  const finalDuration = duration || getDuration('standard');
  const effectiveDuration = reducedMotion ? 0.1 : finalDuration;
  
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: effectiveDuration,
            delay
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface SlideFadeAnimationProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number;
  delay?: number;
  show?: boolean;
}

export const SlideFadeAnimation = ({
  children,
  className,
  direction = "up",
  distance = 20,
  duration,
  delay = 0,
  show = true
}: SlideFadeAnimationProps) => {
  const { getDuration, reducedMotion } = useAnimation();
  
  const finalDuration = duration || getDuration('standard');
  const effectiveDuration = reducedMotion ? 0.1 : finalDuration;
  
  // Define movement based on direction
  const getInitialPosition = () => {
    switch (direction) {
      case "up": return { opacity: 0, y: distance };
      case "down": return { opacity: 0, y: -distance };
      case "left": return { opacity: 0, x: distance };
      case "right": return { opacity: 0, x: -distance };
      default: return { opacity: 0, y: distance };
    }
  };
  
  const getFinalPosition = () => {
    switch (direction) {
      case "up":
      case "down": return { opacity: 1, y: 0 };
      case "left":
      case "right": return { opacity: 1, x: 0 };
      default: return { opacity: 1, y: 0 };
    }
  };
  
  const getExitPosition = () => {
    switch (direction) {
      case "up": return { opacity: 0, y: -distance };
      case "down": return { opacity: 0, y: distance };
      case "left": return { opacity: 0, x: -distance };
      case "right": return { opacity: 0, x: distance };
      default: return { opacity: 0, y: -distance };
    }
  };
  
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={getInitialPosition()}
          animate={getFinalPosition()}
          exit={getExitPosition()}
          transition={{ 
            duration: effectiveDuration,
            delay
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ScaleFadeAnimationProps {
  children: ReactNode;
  className?: string;
  initialScale?: number;
  duration?: number;
  delay?: number;
  show?: boolean;
}

export const ScaleFadeAnimation = ({
  children,
  className,
  initialScale = 0.95,
  duration,
  delay = 0,
  show = true
}: ScaleFadeAnimationProps) => {
  const { getDuration, reducedMotion } = useAnimation();
  
  const finalDuration = duration || getDuration('standard');
  const effectiveDuration = reducedMotion ? 0.1 : finalDuration;
  
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: initialScale }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: initialScale }}
          transition={{ 
            duration: effectiveDuration,
            delay
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  show?: boolean;
}

export const AnimatedList = ({
  children,
  className,
  show = true
}: AnimatedListProps) => {
  const { getDuration, reducedMotion } = useAnimation();
  
  const staggerDuration = getDuration('micro');
  const effectiveStagger = reducedMotion ? 0 : staggerDuration;
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={className}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: effectiveStagger
                }
              },
              hidden: {
                opacity: 0
              }
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  index?: number;
}

export const AnimatedListItem = ({
  children,
  className,
  delay = 0,
  index = 0
}: AnimatedListItemProps) => {
  const { getDuration, reducedMotion } = useAnimation();
  
  const itemDuration = getDuration('standard');
  const effectiveDuration = reducedMotion ? 0.1 : itemDuration;
  const effectiveDelay = reducedMotion ? 0 : delay + (index * 0.05);
  
  return (
    <motion.div
      variants={{
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: effectiveDuration,
            delay: effectiveDelay
          }
        },
        hidden: {
          opacity: 0,
          y: 20
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const AnimatedButton = ({
  children,
  className,
  onClick,
  disabled = false
}: AnimatedButtonProps) => {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </motion.button>
  );
};

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({
  children,
  className
}: PageTransitionProps) => {
  const { getDuration, reducedMotion } = useAnimation();
  
  const pageDuration = getDuration('complex');
  const effectiveDuration = reducedMotion ? 0.1 : pageDuration;
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: effectiveDuration }}
        className={cn("w-full", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

interface PulseAnimationProps {
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
}

export const PulseAnimation = ({
  children,
  className,
  isLoading = true
}: PulseAnimationProps) => {
  const { animationsEnabled, reducedMotion } = useAnimation();
  
  // Skip animation if animations are disabled or reduced motion is preferred
  if (!animationsEnabled || reducedMotion) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <motion.div
      animate={
        isLoading
          ? {
              opacity: [0.7, 1, 0.7],
              scale: [0.98, 1, 0.98],
            }
          : { opacity: 1, scale: 1 }
      }
      transition={
        isLoading
          ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : { duration: 0.3 }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface ShakeAnimationProps {
  children: ReactNode;
  className?: string;
  trigger?: boolean;
}

export const ShakeAnimation = ({
  children,
  className,
  trigger = false
}: ShakeAnimationProps) => {
  const { animationsEnabled, reducedMotion } = useAnimation();
  const [shouldShake, setShouldShake] = useState(false);
  
  useEffect(() => {
    if (trigger) {
      setShouldShake(true);
      const timer = setTimeout(() => {
        setShouldShake(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [trigger]);
  
  // Skip animation if animations are disabled or reduced motion is preferred
  if (!animationsEnabled || reducedMotion) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <motion.div
      animate={
        shouldShake
          ? { x: [0, -10, 10, -5, 5, 0] }
          : { x: 0 }
      }
      transition={
        shouldShake
          ? { 
              duration: 0.5, 
              ease: [0.36, 0.07, 0.19, 0.97]
            }
          : { duration: 0.2 }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface TooltipAnimationProps {
  children: ReactNode;
  className?: string;
  show?: boolean;
}

export const TooltipAnimation = ({
  children,
  className,
  show = false
}: TooltipAnimationProps) => {
  const { getDuration, reducedMotion } = useAnimation();
  
  const tooltipDuration = getDuration('micro');
  const effectiveDuration = reducedMotion ? 0.1 : tooltipDuration;
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 5 }}
          transition={{ duration: effectiveDuration }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};