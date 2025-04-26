import { useState, useEffect } from 'react';

/**
 * A custom hook that returns a boolean indicating whether the current viewport
 * matches the specified media query.
 * @param query - The media query to check against (e.g., '(max-width: 768px)')
 * @returns A boolean indicating whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with a default value based on current window size
  const getMatches = (): boolean => {
    // Check if window is defined (to avoid SSR issues)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches());

  useEffect(() => {
    // Get initial match
    const currentMatches = getMatches();
    // Set state
    setMatches(currentMatches);

    // Create media query list
    const mediaQueryList = window.matchMedia(query);

    // Define a callback to handle media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add the callback as a listener
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
    } else {
      // For older browsers
      mediaQueryList.addListener(handleChange);
    }

    // Clean up
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange);
      } else {
        // For older browsers
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}