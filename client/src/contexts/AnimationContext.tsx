import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useDispatch, useSelector } from 'react-redux';
import { saveAnimationSettings } from '@/store/uiPreferencesSlice';
import { RootState } from '@/store/store';

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
  // Connect to Redux store
  const dispatch = useDispatch();
  const uiPreferences = useSelector((state: RootState) => state.uiPreferences);
  
  // Local state for path tracking - we don't persist these in Redux
  const [currentPath, setCurrentPath] = useState('/');
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [location] = useLocation();

  // States from Redux
  const [animationsEnabled, setAnimationsEnabled] = useState(uiPreferences.animationsEnabled);
  const [reducedMotion, setReducedMotion] = useState(uiPreferences.reducedMotion);
  const [transitionSpeed, setTransitionSpeed] = useState<TransitionSpeed>(
    uiPreferences.transitionSpeed as TransitionSpeed
  );
  const [pageTransition, setPageTransition] = useState<TransitionType>(
    uiPreferences.pageTransition as TransitionType
  );

  // Sync local state with Redux when preferences change
  useEffect(() => {
    setAnimationsEnabled(uiPreferences.animationsEnabled);
    setReducedMotion(uiPreferences.reducedMotion);
    setTransitionSpeed(uiPreferences.transitionSpeed as TransitionSpeed);
    setPageTransition(uiPreferences.pageTransition as TransitionType);
  }, [uiPreferences]);
  
  // Check for reduced motion preference from system
  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const systemReducedMotion = mediaQuery.matches;
      
      // If system preference is different from stored preference, update store
      if (systemReducedMotion !== reducedMotion) {
        dispatch(saveAnimationSettings({ reducedMotion: systemReducedMotion }));
      }
      
      // Listen for changes
      const handleChange = (e: MediaQueryListEvent) => {
        dispatch(saveAnimationSettings({ reducedMotion: e.matches }));
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } catch (error) {
      console.error('Failed to check system reduced motion preference:', error);
    }
  }, [dispatch]);
  
  // Track location changes to update path tracking
  useEffect(() => {
    if (location !== currentPath) {
      setPreviousPath(currentPath);
      setCurrentPath(location);
    }
  }, [location, currentPath]);

  const toggleAnimations = () => {
    const newValue = !animationsEnabled;
    setAnimationsEnabled(newValue);
    dispatch(saveAnimationSettings({ animationsEnabled: newValue }));
  };
  
  const handleSetTransitionSpeed = (speed: TransitionSpeed) => {
    setTransitionSpeed(speed);
    dispatch(saveAnimationSettings({ transitionSpeed: speed }));
  };
  
  const handleSetPageTransition = (type: TransitionType) => {
    setPageTransition(type);
    dispatch(saveAnimationSettings({ pageTransition: type }));
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