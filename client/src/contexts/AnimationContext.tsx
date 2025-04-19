import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  
  // State tracking
  recentlyAnimated: string[];
  addAnimated: (id: string) => void;
  removeAnimated: (id: string) => void;
  isAnimating: (id: string) => boolean;
};

export const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

interface AnimationProviderProps {
  children: ReactNode;
}

export function AnimationProvider({ children }: AnimationProviderProps) {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [transitionSpeed, setTransitionSpeed] = useState<'fast' | 'normal' | 'slow'>('normal');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [recentlyAnimated, setRecentlyAnimated] = useState<string[]>([]);
  
  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Toggle animations on/off
  const toggleAnimations = () => {
    setAnimationsEnabled(prev => !prev);
  };
  
  // Set speed directly
  const setSpeed = (speed: 'fast' | 'normal' | 'slow') => {
    setTransitionSpeed(speed);
  };
  
  // Get duration based on current settings
  const getDuration = (type: 'micro' | 'standard' | 'complex'): number => {
    // If animations are disabled or reduced motion is on, use minimal durations
    if (!animationsEnabled || reducedMotion) {
      return 0.1;
    }
    
    // Base durations for different animation types
    const baseDurations = {
      micro: 0.15,     // For micro-interactions (button hovers, small UI changes)
      standard: 0.3,   // For standard transitions (page elements, dialogs)
      complex: 0.5,    // For complex animations (full page transitions, complex sequences)
    };
    
    // Modify based on selected speed
    const speedMultipliers = {
      fast: 0.7,
      normal: 1.0,
      slow: 1.3,
    };
    
    return baseDurations[type] * speedMultipliers[transitionSpeed];
  };
  
  // Add an ID to the recently animated list
  const addAnimated = (id: string) => {
    setRecentlyAnimated(prev => [...prev, id]);
    
    // Automatically remove after animation completes
    setTimeout(() => {
      removeAnimated(id);
    }, 1000); // Reasonable timeout for most animations
  };
  
  // Remove an ID from the recently animated list
  const removeAnimated = (id: string) => {
    setRecentlyAnimated(prev => prev.filter(item => item !== id));
  };
  
  // Check if an element is currently animating
  const isAnimating = (id: string): boolean => {
    return recentlyAnimated.includes(id);
  };
  
  const value = {
    animationsEnabled,
    transitionSpeed,
    reducedMotion,
    toggleAnimations,
    setTransitionSpeed: setSpeed,
    getDuration,
    recentlyAnimated,
    addAnimated,
    removeAnimated,
    isAnimating,
  };
  
  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}

// Custom hook to use the animation context
export function useAnimation() {
  const context = useContext(AnimationContext);
  
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  
  return context;
}