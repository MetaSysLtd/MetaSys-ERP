import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Create socket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostWithoutPort = window.location.host.split(':')[0];
    const port = window.location.port || (protocol === 'wss:' ? '443' : '80');
    
    // Use the same host and port as the current page
    const socketUrl = `${protocol}//${window.location.host}`;
    
    console.log('Connecting to socket at:', socketUrl);
    
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnected(true);
      
      toast({
        title: "Real-time Updates Active",
        description: "You'll receive instant updates when commission data changes.",
        duration: 3000,
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Clean up socket on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Subscribe to events
  const subscribe = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (!socketRef.current) return;
    
    socketRef.current.on(event, callback);
    
    // Return unsubscribe function
    return () => {
      if (!socketRef.current) return;
      socketRef.current.off(event, callback);
    };
  }, []);

  // Emit events
  const emit = useCallback((event: string, ...args: any[]) => {
    if (!socketRef.current) return;
    socketRef.current.emit(event, ...args);
  }, []);

  return {
    connected,
    socket: socketRef.current,
    subscribe,
    emit
  };
}