import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnimationContext } from "@/contexts/AnimationContext";
import { GradientOverlay } from "./GradientOverlay";

interface AnimatedPageProps {
  children: ReactNode;
}

export function AnimatedPage({ children }: AnimatedPageProps) {
  const { 
    pageTransition, 
    currentPath, 
    previousPath, 
    animationsEnabled, 
    reducedMotion, 
    getDuration 
  } = useAnimationContext();
  
  // If animations are disabled or reduced motion is preferred, return children directly
  if (!animationsEnabled || reducedMotion) {
    return <>{children}</>;
  }

  // Define motion variants based on the transition type
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { x: 20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -20, opacity: 0 },
    },
    zoom: {
      initial: { scale: 0.97, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.97, opacity: 0 },
    },
    gradient: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
  };

  const duration = getDuration("standard");

  // Determine if we should show the gradient overlay
  const showGradientOverlay = pageTransition === "gradient" && previousPath !== null;

  return (
    <div className="relative w-full h-full">
      {/* Main content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPath}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants[pageTransition]}
          transition={{ 
            duration, 
            ease: "easeInOut" 
          }}
          className="h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay for smooth transitions */}
      {showGradientOverlay && (
        <AnimatePresence>
          <GradientOverlay 
            key={`overlay-${currentPath}`} 
            isActive={true} 
          />
        </AnimatePresence>
      )}
    </div>
  );
}