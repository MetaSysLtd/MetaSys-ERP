import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useDispatch, useSelector } from 'react-redux';
import { saveAnimationSettings, updatePreferences } from '@/store/uiPreferencesSlice';
import { RootState } from '@/store/store';
import { useToast } from '@/hooks/use-toast';

type TransitionSpeed = 'fast' | 'normal' | 'slow';
type AnimationDurationType = 'standard' | 'complex' | 'subtle';
type TransitionType = 'fade' | 'slide' | 'zoom' | 'gradient';

interface AnimationContextType {
  animationsEnabled: boolean;
  toggleAnimations: () => void;
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  transitionSpeed: TransitionSpeed;
  setTransitionSpeed: (speed: TransitionSpeed) => void;
  getDuration: (type: AnimationDurationType | number) => number;
  pageTransition: TransitionType;
  setPageTransition: (type: TransitionType) => void;
  currentPath: string;
  previousPath: string | null;
  isSaving: boolean;
}

const defaultContext: AnimationContextType = {
  // CRITICAL FIX: Set animations off by default for performance
  animationsEnabled: false,
  toggleAnimations: () => {},
  reducedMotion: false,
  toggleReducedMotion: () => {},
  transitionSpeed: 'normal',
  setTransitionSpeed: () => {},
  getDuration: (type: AnimationDurationType | number) => typeof type === 'number' ? type : 0.3,
  // Use simpler transition for better performance
  pageTransition: 'fade',
  setPageTransition: () => {},
  currentPath: '/',
  previousPath: null,
  isSaving: false
};

export const AnimationContext = createContext<AnimationContextType>(defaultContext);

export function AnimationProvider({ children }: { children: ReactNode }) {
  // Connect to Redux store
  const dispatch = useDispatch();
  const uiPreferences = useSelector((state: RootState) => state.uiPreferences);
  const { toast } = useToast();
  
  // Local state for path tracking and save status
  const [currentPath, setCurrentPath] = useState('/');
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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
  
  // Save animation settings to database and sync with Redux
  const saveSettings = async (settings: any) => {
    setIsSaving(true);
    try {
      // Update Redux state and persist to server
      await dispatch(updatePreferences(settings));
    } catch (error) {
      console.error('Failed to save animation settings:', error);
      toast({
        title: "Failed to save settings",
        description: "Your animation preferences couldn't be saved. They will be restored on your next login.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Check for reduced motion preference from system
  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const systemReducedMotion = mediaQuery.matches;
      
      // If system preference is different from stored preference, update store
      if (systemReducedMotion !== reducedMotion) {
        saveSettings({ reducedMotion: systemReducedMotion });
      }
      
      // Listen for changes
      const handleChange = (e: MediaQueryListEvent) => {
        saveSettings({ reducedMotion: e.matches });
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
    saveSettings({ animationsEnabled: newValue });
  };
  
  const toggleReducedMotion = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    saveSettings({ reducedMotion: newValue });
  };
  
  const handleSetTransitionSpeed = (speed: TransitionSpeed) => {
    setTransitionSpeed(speed);
    saveSettings({ transitionSpeed: speed });
  };
  
  const handleSetPageTransition = (type: TransitionType) => {
    setPageTransition(type);
    saveSettings({ pageTransition: type });
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
        toggleReducedMotion,
        transitionSpeed,
        setTransitionSpeed: handleSetTransitionSpeed,
        getDuration,
        pageTransition,
        setPageTransition: handleSetPageTransition,
        currentPath,
        previousPath,
        isSaving
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
}

export const useAnimationContext = () => useContext(AnimationContext);
export const useAnimation = () => useContext(AnimationContext);