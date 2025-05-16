import React, { useEffect, useState } from "react";
import { LeadNotificationContainer } from "@/components/dispatch/lead-notification-container";
import { useLeadNotifications } from "@/hooks/use-lead-notifications";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { MotionWrapper } from "@/components/ui/motion-wrapper-fixed";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeasure, useMouse, useWindowSize } from 'react-use';

// Define a custom useMediaQuery hook
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = React.useState(
    () => window.matchMedia(query).matches
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};


/**
 * Global notification container that integrates socket events with UI components
 * This component is conditionally rendered based on:
 * 1. User role and permissions
 * 2. Current route (dashboard routes only)
 */
export function NotificationContainer() {
  const { user, role } = useAuth();
  const { socket, emit } = useSocket();
  const { notifications, isLoading } = useLeadNotifications();
  const [location] = useLocation();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Show skeleton loader if data takes more than 1 second to load
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowSkeleton(true);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [isLoading]);

  // Authenticate socket connection when user is logged in
  useEffect(() => {
    if (socket && user?.id) {
      // Authenticate with user ID to join correct socket rooms
      emit('authenticate', user.id);
    }
  }, [socket, user, emit]);

  // Only show for users with appropriate permissions
  const hasPermission = 
    role?.department === 'dispatch' || 
    role?.department === 'sales' ||
    (role?.department === 'admin' && role.level >= 3);

  // Check if current route is a dashboard route
  const isDashboardRoute = 
    location === "/" || 
    location === "/dashboard" || 
    location === "/dispatch/dashboard" ||
    location === "/sales/dashboard";

  // Don't show on explicitly excluded routes
  const isExcludedRoute = 
    location.startsWith("/crm") ||
    location.startsWith("/dispatch/loads") ||
    location.startsWith("/dispatch/clients") ||
    location.startsWith("/dispatch/new-load") ||
    location.startsWith("/invoices") ||
    location.startsWith("/finance") ||
    location.startsWith("/hr") ||
    location.startsWith("/marketing") ||
    location.startsWith("/profile") || 
    location.startsWith("/settings") ||
    location.startsWith("/admin") ||
    location.startsWith("/time-tracking") ||
    location.startsWith("/reports") ||
    location.includes("/load/") ||
    location.includes("/invoice/") ||
    location.includes("/lead/") ||
    location.includes("/client/");

  // Not a dashboard route or explicitly excluded
  if (!hasPermission || !user || !isDashboardRoute || isExcludedRoute) {
    return null;
  }

  return (
    <MotionWrapper 
      animation="fade" 
      delay={0.3}
      className={`z-50 sticky top-0 mb-6 ${isMobile ? 'w-full' : 'max-w-3xl mx-auto'}`}
    >
      {isLoading && showSkeleton ? (
        <div className={`w-full rounded-md border border-gray-200 p-4 ${isMobile ? 'sm:w-[95%]' : 'md:w-full sm:w-[95%]'} `}>
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      ) : (
        <LeadNotificationContainer />
      )}
    </MotionWrapper>
  );
}