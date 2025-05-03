import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

type TransitionSpeed = 'fast' | 'normal' | 'slow';
type AnimationDurationType = 'standard' | 'complex' | 'subtle';
type TransitionType = 'fade' | 'slide' | 'zoom' | 'gradient';

interface AnimationContextType {
  animationsEnabled: boolean;
  toggleAnimations: () => void;
  reducedMotion: boolean;
  transitionSpeed: TransitionSpeed;
  setTransitionSpeed: (speed: TransitionSpeed) => void;
  getDuration: (type: AnimationDurationType | number) => number;
  pageTransition: TransitionType;
  setPageTransition: (type: TransitionType) => void;
  currentPath: string;
  previousPath: string | null;
}

const defaultContext: AnimationContextType = {
  animationsEnabled: true,
  toggleAnimations: () => {},
  reducedMotion: false,
  transitionSpeed: 'normal',
  setTransitionSpeed: () => {},
  getDuration: (type: AnimationDurationType | number) => typeof type === 'number' ? type : 0.3,
  pageTransition: 'gradient',
  setPageTransition: () => {},
  currentPath: '/',
  previousPath: null,
};

export const AnimationContext = createContext<AnimationContextType>(defaultContext);

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [transitionSpeed, setTransitionSpeed] = useState<TransitionSpeed>('normal');
  const [pageTransition, setPageTransition] = useState<TransitionType>('gradient');
  const [currentPath, setCurrentPath] = useState('/');
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [location] = useLocation();

  // On mount, check local storage for animation preferences
  useEffect(() => {
    try {
      // Check for animations enabled preference
      const storedPreference = localStorage.getItem('metasys_animations_enabled');
      // Only disable if explicitly set to "false"
      if (storedPreference === 'false') {
        setAnimationsEnabled(false);
      }
      
      // Check for transition speed preference
      const storedSpeed = localStorage.getItem('metasys_transition_speed');
      // Default to 'normal' if not set
      if (storedSpeed && ['fast', 'normal', 'slow'].includes(storedSpeed)) {
        setTransitionSpeed(storedSpeed as TransitionSpeed);
      } else {
        // If no preference is set, store the default 'normal' speed
        localStorage.setItem('metasys_transition_speed', 'normal');
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
      console.error('Failed to read animation preferences from localStorage:', error);
    }
  }, []);
  
  // Track location changes to update path tracking
  useEffect(() => {
    if (location !== currentPath) {
      setPreviousPath(currentPath);
      setCurrentPath(location);
    }
  }, [location, currentPath]);
  
  // Check for page transition preference in local storage
  useEffect(() => {
    try {
      const storedTransitionType = localStorage.getItem('metasys_page_transition');
      if (storedTransitionType && ['fade', 'slide', 'zoom', 'gradient'].includes(storedTransitionType)) {
        setPageTransition(storedTransitionType as TransitionType);
      } else {
        // If no preference is set, store the default 'gradient' transition
        localStorage.setItem('metasys_page_transition', 'gradient');
      }
    } catch (error) {
      console.error('Failed to read page transition preference from localStorage:', error);
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
  
  const handleSetTransitionSpeed = (speed: TransitionSpeed) => {
    setTransitionSpeed(speed);
    try {
      localStorage.setItem('metasys_transition_speed', speed);
    } catch (error) {
      console.error('Failed to save transition speed preference to localStorage:', error);
    }
  };
  
  const handleSetPageTransition = (type: TransitionType) => {
    setPageTransition(type);
    try {
      localStorage.setItem('metasys_page_transition', type);
    } catch (error) {
      console.error('Failed to save page transition preference to localStorage:', error);
    }
  };
  
  // Utility function to adjust animation duration based on user preferences and type
  const getDuration = (type: AnimationDurationType | number): number => {
    if (!animationsEnabled) return 0;
    if (reducedMotion) return typeof type === 'number' ? type * 0.5 : 0.15;
    
    // If a number is provided, apply speed modifier directly
    if (typeof type === 'number') {
      const speedMultiplier = transitionSpeed === 'fast' ? 0.7 : transitionSpeed === 'slow' ? 1.5 : 1;
      return type * speedMultiplier;
    }
    
    // For named animation types, provide appropriate durations based on speed setting
    const baseDurations = {
      standard: transitionSpeed === 'fast' ? 0.15 : transitionSpeed === 'slow' ? 0.4 : 0.25,
      complex: transitionSpeed === 'fast' ? 0.3 : transitionSpeed === 'slow' ? 0.8 : 0.5,
      subtle: transitionSpeed === 'fast' ? 0.1 : transitionSpeed === 'slow' ? 0.3 : 0.2
    };
    
    return baseDurations[type];
  };

  return (
    <AnimationContext.Provider
      value={{
        animationsEnabled,
        toggleAnimations,
        reducedMotion,
        transitionSpeed,
        setTransitionSpeed: handleSetTransitionSpeed,
        getDuration,
        pageTransition,
        setPageTransition: handleSetPageTransition,
        currentPath,
        previousPath,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
}

export const useAnimationContext = () => useContext(AnimationContext);
export const useAnimation = () => useContext(AnimationContext);