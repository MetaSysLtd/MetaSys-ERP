import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Fade animation variants
const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Slide fade animation variants
const slideFadeVariants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30 
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { 
      duration: 0.2 
    } 
  }
};

// Scale fade animation variants
const scaleFadeVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 500, 
      damping: 30 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.98,
    transition: { 
      duration: 0.15 
    } 
  }
};

// Staggered list animation - for list items
const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.07,
      delayChildren: 0.05
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

const listItemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { 
      duration: 0.2 
    }
  }
};

// Button press animation variants
const buttonPressVariants = {
  initial: { scale: 1 },
  press: { 
    scale: 0.95,
    transition: { 
      type: "spring",
      stiffness: 500, 
      damping: 30 
    } 
  },
  release: { 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 500, 
      damping: 20 
    } 
  }
};

// Fade In Animation Component
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
  duration = 0.3,
  delay = 0,
  show = true
}: FadeAnimationProps) => {
  const customVariants = {
    ...fadeVariants,
    visible: {
      ...fadeVariants.visible,
      transition: {
        duration,
        delay
      }
    }
  };
  
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={className}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={customVariants}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Slide Fade Animation Component
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
  duration = 0.3,
  delay = 0,
  show = true
}: SlideFadeAnimationProps) => {
  // Define direction-based variants
  let directionProps = { y: distance };
  if (direction === "down") directionProps = { y: -distance };
  if (direction === "left") directionProps = { x: distance, y: 0 };
  if (direction === "right") directionProps = { x: -distance, y: 0 };
  
  const customVariants = {
    hidden: { 
      opacity: 0, 
      ...directionProps 
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        duration,
        delay
      }
    },
    exit: { 
      opacity: 0, 
      ...directionProps,
      transition: { 
        duration: 0.2 
      } 
    }
  };
  
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={className}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={customVariants}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Scale Fade Animation Component
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
  duration = 0.3,
  delay = 0,
  show = true
}: ScaleFadeAnimationProps) => {
  const customVariants = {
    hidden: { 
      opacity: 0, 
      scale: initialScale 
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 30,
        duration,
        delay
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.98,
      transition: { 
        duration: 0.15 
      } 
    }
  };
  
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={className}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={customVariants}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Animated List Container and Item components
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
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={className}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={listContainerVariants}
        >
          {children}
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
  const customVariants = {
    ...listItemVariants,
    visible: {
      ...listItemVariants.visible,
      transition: {
        ...listItemVariants.visible.transition,
        delay: delay + (index * 0.05)
      }
    }
  };
  
  return (
    <motion.div
      className={className}
      variants={customVariants}
    >
      {children}
    </motion.div>
  );
};

// Animated Button component
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
      className={cn(
        "transition-colors",
        className
      )}
      variants={buttonPressVariants}
      initial="initial"
      whileTap="press"
      animate="release"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
};

// Page Transition component
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({
  children,
  className
}: PageTransitionProps) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30
      }}
    >
      {children}
    </motion.div>
  );
};

// Loading animation (pulse)
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
  return (
    <motion.div
      className={className}
      animate={isLoading ? {
        opacity: [0.7, 1, 0.7],
        scale: [0.98, 1, 0.98]
      } : {}}
      transition={isLoading ? {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      } : {}}
    >
      {children}
    </motion.div>
  );
};

// Notification animation (bell shake)
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
  return (
    <motion.div
      className={className}
      animate={trigger ? {
        rotate: [0, -10, 10, -10, 10, 0]
      } : {}}
      transition={trigger ? {
        duration: 0.5,
        ease: "easeInOut"
      } : {}}
    >
      {children}
    </motion.div>
  );
};

// Tooltip animation
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
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={className}
          initial={{ opacity: 0, scale: 0.8, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 5 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};