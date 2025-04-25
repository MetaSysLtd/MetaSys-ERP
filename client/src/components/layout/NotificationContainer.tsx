import { useEffect } from "react";
import { LeadNotificationContainer } from "@/components/dispatch/lead-notification-container";
import { useLeadNotifications } from "@/hooks/use-lead-notifications";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { MotionWrapper } from "@/components/ui/motion-wrapper-fixed";

/**
 * Global notification container that integrates socket events with UI components
 * This component is conditionally rendered based on user role and whether notifications exist
 */
export function NotificationContainer() {
  const { user, role } = useAuth();
  const { socket, emit } = useSocket();
  const { notifications } = useLeadNotifications();
  
  // Authenticate socket connection when user is logged in
  useEffect(() => {
    if (socket && user?.id) {
      // Authenticate with user ID to join correct socket rooms
      emit('authenticate', user.id);
    }
  }, [socket, user, emit]);

  // Only show for dispatcher role or admin with dispatch department
  const isDispatcherOrAdmin = 
    role?.department === 'dispatch' || 
    (role?.department === 'admin' && role.level >= 3);

  // No notifications or user is not in dispatch department
  if (!isDispatcherOrAdmin || !user) return null;

  return (
    <MotionWrapper 
      animation="fade" 
      delay={0.5}
      className="z-50"
    >
      {/* Lead notifications for dispatchers */}
      {notifications.length > 0 && (
        <LeadNotificationContainer />
      )}
    </MotionWrapper>
  );
}