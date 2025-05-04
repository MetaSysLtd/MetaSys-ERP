import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnimationContext } from "@/contexts/AnimationContext";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const { pageTransition, currentPath, previousPath, animationsEnabled, reducedMotion, getDuration } = useAnimationContext();
  const [key, setKey] = useState(currentPath);

  // Update the key when the path changes to trigger animations
  useEffect(() => {
    setKey(currentPath);
  }, [currentPath]);

  // Return children directly if animations are disabled or reduced motion is preferred
  if (!animationsEnabled || reducedMotion) {
    return <>{children}</>;
  }

  // Define transition variants based on the selected transition type
  const getVariants = () => {
    switch (pageTransition) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
      case 'slide':
        return {
          initial: { x: 20, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: -20, opacity: 0 },
        };
      case 'zoom':
        return {
          initial: { scale: 0.95, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.95, opacity: 0 },
        };
      case 'gradient':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  // Get the appropriate duration based on animation settings
  const duration = getDuration('standard');

  // For gradient transitions, we need a separate overlay component
  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={getVariants()}
          transition={{ duration }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay for the 'gradient' transition type */}
      {pageTransition === 'gradient' && previousPath !== null && (
        <AnimatePresence>
          <motion.div
            key={`overlay-${currentPath}`}
            className="fixed inset-0 pointer-events-none z-50"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration * 1.5 }}
            style={{
              background: 'linear-gradient(135deg, rgba(2,94,115,0.3) 0%, rgba(242,167,27,0.3) 50%, rgba(65,39,84,0.3) 100%)',
              backdropFilter: 'blur(8px)',
            }}
          />
        </AnimatePresence>
      )}
    </div>
  );
}