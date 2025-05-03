import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface AnimationContextType {
  animationsEnabled: boolean;
  toggleAnimations: () => void;
  reducedMotion: boolean;
  getDuration: (baseDuration: number) => number;
}

const defaultContext: AnimationContextType = {
  animationsEnabled: true,
  toggleAnimations: () => {},
  reducedMotion: false,
  getDuration: (baseDuration: number) => baseDuration,
};

export const AnimationContext = createContext<AnimationContextType>(defaultContext);

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  // On mount, check local storage for animation preference
  useEffect(() => {
    try {
      const storedPreference = localStorage.getItem('metasys_animations_enabled');
      // Only disable if explicitly set to "false"
      if (storedPreference === 'false') {
        setAnimationsEnabled(false);
      }
      
      // Check for reduced motion preference
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      
      // Listen for changes
      const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } catch (error) {
      console.error('Failed to read animation preference from localStorage:', error);
    }
  }, []);

  const toggleAnimations = () => {
    const newValue = !animationsEnabled;
    setAnimationsEnabled(newValue);
    try {
      localStorage.setItem('metasys_animations_enabled', String(newValue));
    } catch (error) {
      console.error('Failed to save animation preference to localStorage:', error);
    }
  };
  
  // Utility function to adjust animation duration based on user preferences
  const getDuration = (baseDuration: number): number => {
    if (!animationsEnabled) return 0;
    if (reducedMotion) return baseDuration * 0.5;
    return baseDuration;
  };

  return (
    <AnimationContext.Provider
      value={{
        animationsEnabled,
        toggleAnimations,
        reducedMotion,
        getDuration,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
}

export const useAnimationContext = () => useContext(AnimationContext);
export const useAnimation = () => useContext(AnimationContext);