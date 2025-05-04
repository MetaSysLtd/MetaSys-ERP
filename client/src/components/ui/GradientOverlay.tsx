import { motion } from "framer-motion";
import { useAnimationContext } from "@/contexts/AnimationContext";

interface GradientOverlayProps {
  isActive: boolean;
  direction?: "in" | "out";
}

export function GradientOverlay({ isActive, direction = "in" }: GradientOverlayProps) {
  const { getDuration } = useAnimationContext();
  const duration = getDuration("complex");

  // Define several gradient variations to have visual variety between transitions
  const gradients = [
    // Brand teal to yellow
    "linear-gradient(135deg, rgba(2,94,115,0.4) 0%, rgba(242,167,27,0.3) 100%)",
    // Brand plum to yellow
    "linear-gradient(135deg, rgba(65,39,84,0.4) 0%, rgba(242,167,27,0.3) 100%)",
    // Brand navy to teal
    "linear-gradient(135deg, rgba(1,31,38,0.4) 0%, rgba(2,94,115,0.3) 100%)",
    // Brand yellow to plum
    "linear-gradient(135deg, rgba(242,167,27,0.4) 0%, rgba(65,39,84,0.3) 100%)",
    // A mix of all brand colors
    "linear-gradient(135deg, rgba(1,31,38,0.3) 0%, rgba(2,94,115,0.3) 33%, rgba(242,167,27,0.3) 66%, rgba(65,39,84,0.3) 100%)",
  ];

  // Get a pseudorandom gradient based on the current time
  // This gives visual variety while still being deterministic for the same path
  const getRandomGradient = () => {
    return gradients[Math.floor(Date.now() / 1000) % gradients.length];
  };

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50"
      initial={{ opacity: direction === "in" ? 1 : 0 }}
      animate={{ opacity: isActive ? (direction === "in" ? 0 : 1) : 0 }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration, 
        ease: "easeInOut" 
      }}
      style={{
        background: getRandomGradient(),
        backdropFilter: "blur(8px)",
      }}
    />
  );
}