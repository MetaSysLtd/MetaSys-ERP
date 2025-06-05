import { useEffect } from 'react';
import { API_ROUTES } from '@shared/constants';

interface UseSessionKeepaliveProps {
  isAuthenticated: boolean;
  onSessionExpired: () => void;
}

export function useSessionKeepalive({ isAuthenticated, onSessionExpired }: UseSessionKeepaliveProps) {
  useEffect(() => {
    if (!isAuthenticated) return;

    const sessionCheck = async () => {
      try {
        const response = await fetch(`${API_ROUTES.AUTH.ME}?_t=${new Date().getTime()}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        });

        if (!response.ok) {
          console.warn('Session expired during keepalive check');
          onSessionExpired();
          return;
        }

        const data = await response.json();
        if (!data.authenticated) {
          console.warn('Session is no longer valid during keepalive');
          onSessionExpired();
        }
      } catch (error) {
        console.warn('Session keepalive error:', error);
        // Don't log out on network errors, only on auth failures
      }
    };

    // Check session every 5 minutes
    const interval = setInterval(sessionCheck, 5 * 60 * 1000);

    // Cleanup interval on component unmount or auth state change
    return () => clearInterval(interval);
  }, [isAuthenticated, onSessionExpired]);
}