import { useEffect, useRef } from 'react';

/**
 * A hook to dynamically update the document title.
 * @param title - The title to set for the document
 * @param options - Options for title behavior
 * @returns void
 */
export function useTitle(
  title: string,
  options: { 
    restoreOnUnmount?: boolean 
  } = {}
) {
  const { restoreOnUnmount = false } = options;
  const previousTitle = useRef(document.title);

  useEffect(() => {
    // Update the document title
    document.title = title;
  }, [title]);

  // Restore the previous title when the component unmounts if specified
  useEffect(() => {
    if (restoreOnUnmount) {
      return () => {
        document.title = previousTitle.current;
      };
    }
  }, [restoreOnUnmount]);
}