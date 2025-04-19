import React, { ReactNode } from "react";
import { motion, MotionProps, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Transition presets for different animation types
 */
export const transitions = {
  // Smooth transition for most UI elements
  smooth: {
    type: "spring",
    stiffness: 500,
    damping: 30,
  },
  
  // Quick elastic bounce effect
  bounce: {
    type: "spring",
    stiffness: 300,
    damping: 15,
  },
  
  // Subtle transition for background effects
  subtle: {
    type: "spring",
    stiffness: 200,
    damping: 20,
  },
  
  // Delayed staggered transition for lists
  staggered: (delay = 0) => ({
    type: "spring",
    stiffness: 300,
    damping: 25,
    delay,
  }),
  
  // Fast transition for micro-interactions
  quick: {
    type: "spring",
    stiffness: 700,
    damping: 30,
  },
  
  // Easy in/out for modals
  modal: {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3,
  }
};

/**
 * Animation variant presets for common use cases
 */
export const animations = {
  // Fade in from transparent to opaque
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  
  // Scale up from slightly smaller to normal size with fade
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  
  // Fade in and slide up from below
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  
  // Fade in and slide down from above
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  
  // Fade in and slide in from left
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  
  // Fade in and slide in from right
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
  
  // Pop effect with slight bounce
  popIn: {
    hidden: { opacity: 0, scale: 0.4 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
      }
    },
  },
  
  // For list items, stagger children animations
  list: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  },
  
  // For list item children to be used with the list variant
  listItem: {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: transitions.smooth
    }
  },
  
  // For cards and containers
  container: {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: transitions.smooth
    }
  },
  
  // For modals and dialogs
  modal: {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: transitions.modal
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  },
  
  // For sidebar or drawer
  drawer: {
    hidden: { x: "-100%" },
    visible: { 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    }
  },
  
  // For hover effects
  hover: {
    initial: { scale: 1 },
    hover: { 
      scale: 1.03,
      transition: {
        duration: 0.2
      }
    }
  },
  
  // For active/pressed effects
  press: {
    initial: { scale: 1 },
    press: { 
      scale: 0.97,
      transition: {
        duration: 0.1
      }
    }
  },
  
  // For status change highlights
  highlight: {
    initial: { backgroundColor: "transparent" },
    highlight: { 
      backgroundColor: "var(--highlight-color, rgba(59, 130, 246, 0.2))",
      transition: {
        duration: 0.3,
        repeat: 1,
        repeatType: "reverse"
      }
    }
  }
};

interface AnimatedContainerProps extends MotionProps {
  children: ReactNode;
  className?: string;
  animation?: keyof typeof animations | Variants;
  transition?: keyof typeof transitions | any;
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
  transition = "smooth",
  delay = 0,
  duration,
  as = "div",
  containerRef,
  staggerIndex = 0,
  ...props
}: AnimatedContainerProps) {
  const MotionComponent = motion[as as keyof typeof motion] || motion.div;
  
  // Get variant based on string name or use provided variants object
  const animationVariant = typeof animation === 'string' 
    ? animations[animation as keyof typeof animations] 
    : animation;
  
  // Get transition based on string name or use provided transition object
  const transitionConfig = typeof transition === 'string'
    ? { ...transitions[transition as keyof typeof transitions] }
    : transition;
  
  // Apply delay and duration if provided
  if (delay && typeof transitionConfig === 'object') {
    transitionConfig.delay = delay + (staggerIndex * 0.05); // Add stagger delay if index provided
  }
  
  if (duration && typeof transitionConfig === 'object') {
    transitionConfig.duration = duration;
  }
  
  return (
    <MotionComponent
      ref={containerRef}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={animationVariant.hover ? "hover" : undefined}
      whileTap={animationVariant.press ? "press" : undefined}
      variants={animationVariant}
      transition={transitionConfig}
      className={cn(className)}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

/**
 * AnimatedList is a specialized variant of AnimatedContainer
 * designed specifically for rendering animated lists with staggered children
 */
export function AnimatedList({
  children,
  className,
  animation = "list",
  transition = "smooth",
  delay = 0,
  as = "ul",
  ...props
}: AnimatedContainerProps) {
  return (
    <AnimatedContainer
      className={className}
      animation={animation}
      transition={transition}
      delay={delay}
      as={as}
      {...props}
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
  animation = "listItem",
  transition = "smooth",
  staggerIndex = 0,
  as = "li",
  ...props
}: AnimatedContainerProps) {
  return (
    <AnimatedContainer
      className={className}
      animation={animation}
      transition={transition}
      staggerIndex={staggerIndex}
      as={as}
      {...props}
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
  animation = "container",
  transition = "smooth",
  delay = 0,
  ...props
}: AnimatedContainerProps) {
  return (
    <AnimatedContainer
      className={cn("rounded-lg border bg-card text-card-foreground shadow", className)}
      animation={animation}
      transition={transition}
      delay={delay}
      {...props}
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
  transition = "smooth",
  delay = 0,
  ...props
}: AnimatedContainerProps) {
  return (
    <AnimatedContainer
      animation={animation}
      transition={transition}
      delay={delay}
      {...props}
    >
      {children}
    </AnimatedContainer>
  );
}

export default AnimatedContainer;