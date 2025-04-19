import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';

type AnimationContextType = {
  // Global animation settings
  animationsEnabled: boolean;
  transitionSpeed: 'fast' | 'normal' | 'slow';
  reducedMotion: boolean;
  
  // Helper methods
  toggleAnimations: () => void;
  setTransitionSpeed: (speed: 'fast' | 'normal' | 'slow') => void;
  
  // Animation specific durations
  getDuration: (type: 'micro' | 'standard' | 'complex') => number;
};

export const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

interface AnimationProviderProps {
  children: ReactNode;
}

export function AnimationProvider({ children }: AnimationProviderProps) {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [transitionSpeed, setTransitionSpeed] = useState<'fast' | 'normal' | 'slow'>('normal');
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check for user's reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleAnimations = () => setAnimationsEnabled(prev => !prev);

  const getDuration = (type: 'micro' | 'standard' | 'complex'): number => {
    // Base durations in seconds
    const baseDurations = {
      micro: 0.15,     // Very quick animations (button hover, etc)
      standard: 0.3,   // Standard transitions (page elements fading in)
      complex: 0.5,    // More complex animations (charts, etc)
    };
    
    // Speed multipliers
    const speedMultipliers = {
      fast: 0.7,
      normal: 1,
      slow: 1.3,
    };
    
    return baseDurations[type] * speedMultipliers[transitionSpeed];
  };

  const value = {
    animationsEnabled,
    transitionSpeed,
    reducedMotion,
    toggleAnimations,
    setTransitionSpeed,
    getDuration,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
}