import { ReactNode } from "react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const slideVariants = {
  "fade-up": { 
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  },
  "fade-down": { 
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 }
  },
  "fade-left": { 
    hidden: { opacity: 0, x: 10 },
    visible: { opacity: 1, x: 0 }
  },
  "fade-right": { 
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  },
  "scale-up": { 
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1 }
  },
  "fade-in": { 
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }
}

type AnimationTypes = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale-up" | "fade-in";

interface MotionWrapperProps {
  children: ReactNode;
  className?: string;
  animation: AnimationTypes;
  delay?: number;
  duration?: number;
  threshold?: number;
}

export function MotionWrapper({ 
  children, 
  className = "",
  animation = "fade-up", 
  delay = 0, 
  duration = 0.3,
  threshold = 0.1 
}: MotionWrapperProps) {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold, triggerOnce: true });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={slideVariants[animation]}
      initial="hidden"
      animate={controls}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

interface MotionListProps {
  children: ReactNode;
  className?: string;
  animation?: AnimationTypes;
  delay?: number;
  staggerDelay?: number;
  duration?: number;
  threshold?: number;
}

export function MotionList({ 
  children, 
  className = "",
  animation = "fade-up", 
  delay = 0, 
  staggerDelay = 0.1,
  duration = 0.3,
  threshold = 0.1 
}: MotionListProps) {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold, triggerOnce: true });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delay,
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}