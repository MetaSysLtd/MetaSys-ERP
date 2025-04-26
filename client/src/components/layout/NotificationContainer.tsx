import { useEffect, useState } from "react";
import { LeadNotificationContainer } from "@/components/dispatch/lead-notification-container";
import { useLeadNotifications, LeadNotificationType } from "@/hooks/use-lead-notifications";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { MotionWrapper } from "@/components/ui/motion-wrapper-fixed";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from '@/components/ui/card';

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
  
  // Log debug information to console
  useEffect(() => {
    console.log("Current route:", location);
    console.log("Has notifications:", notifications.length);
    console.log("Is Dashboard route:", 
      location === "/" || 
      location === "/dashboard" || 
      location === "/dispatch/dashboard" ||
      location === "/sales/dashboard");
  }, [location, notifications]);

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
  const hasPermission = true; // Temporarily allow all users to see notifications
  
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

  // Debug message - can be removed once notifications are working correctly
  if (isDashboardRoute && !isExcludedRoute) {
    console.log("Should show notifications - route is:", location);
  }

  // Not a dashboard route or explicitly excluded
  if (!hasPermission || !user || !isDashboardRoute || isExcludedRoute) {
    return null;
  }
  
  // Force display a sample notification panel for debugging
  const FORCE_DISPLAY = true;

  return (
    <MotionWrapper 
      animation="fade" 
      delay={0.3}
      className="z-50 sticky top-0 mb-6"
    >
      {/* Always show a test panel on dashboard routes */}
      {FORCE_DISPLAY ? (
        <Card className="w-full max-w-3xl mx-auto mb-6 shadow-md border border-gray-200 md:w-full sm:w-[95%]">
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Lead Notifications Panel</h2>
            <p className="text-sm text-gray-600 mb-4">
              This panel should only appear on dashboard routes.
              Current route: {location}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-md">Dashboard: {isDashboardRoute ? 'Yes' : 'No'}</div>
              <div className="bg-red-100 text-red-800 px-2 py-1 rounded-md">Excluded: {isExcludedRoute ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </Card>
      ) : isLoading && showSkeleton ? (
        <div className="w-full max-w-3xl mx-auto mb-6 rounded-md border border-gray-200 p-4 md:w-full sm:w-[95%]">
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