import { useEffect } from "react";

/**
 * Hook to set document title with optional company name
 * @param title Page title to set
 * @param includeCompanyName Whether to include company name after the title
 */
export function useTitle(title: string, includeCompanyName = true) {
  useEffect(() => {
    const companyName = "MetaSys ERP";
    document.title = includeCompanyName ? `${title} | ${companyName}` : title;
    
    return () => {
      // Optionally reset to default on unmount
      if (includeCompanyName) {
        document.title = companyName;
      }
    };
  }, [title, includeCompanyName]);
}