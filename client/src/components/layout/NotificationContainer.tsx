import { useEffect, useState } from "react";
import { LeadNotificationContainer } from "@/components/dispatch/lead-notification-container";
import { useLeadNotifications } from "@/hooks/use-lead-notifications";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { MotionWrapper } from "@/components/ui/motion-wrapper-fixed";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Global notification container that integrates socket events with UI components
 * This component is conditionally rendered based on:
 * 1. User role and permissions
 * 2. Current route (dashboard routes only)
 * 3. Organization settings
 */
export function NotificationContainer() {
  const { user, role } = useAuth();
  const { socket, emit } = useSocket();
  const { notifications, isLoading } = useLeadNotifications();
  const [location] = useLocation();
  const [showSkeleton, setShowSkeleton] = useState(false);
  
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

  // Only show for users with appropriate role and permissions
  const hasPermission = 
    role?.department === 'dispatch' || 
    role?.department === 'sales' ||
    (role?.department === 'admin' && role.level >= 3);

  // Check if current route is a dashboard route where notifications should be shown
  // Per requirements: show ONLY on dashboard routes
  const isDashboardRoute = 
    location === "/" || 
    location === "/dashboard" || 
    location === "/dispatch/dashboard" ||
    location === "/sales/dashboard";
  
  // Explicitly check routes where we should NOT show the notifications
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
    // Detail pages
    location.includes("/load/") ||
    location.includes("/invoice/") ||
    location.includes("/lead/") ||
    location.includes("/client/");

  // Not permitted or explicitly excluded route
  if (!hasPermission || !user || !isDashboardRoute || isExcludedRoute) return null;

  return (
    <MotionWrapper 
      animation="fade" 
      delay={0.3}
      className="z-50 sticky top-0 mb-6"
    >
      {/* Show skeleton loader if needed */}
      {isLoading && showSkeleton ? (
        <div className="w-full max-w-3xl mx-auto mb-6 rounded-md border border-gray-200 p-4 md:w-full sm:w-[95%]">
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      ) : (
        /* Lead notifications when loaded */
        <LeadNotificationContainer />
      )}
    </MotionWrapper>
  );
}