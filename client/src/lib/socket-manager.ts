import { Socket, io } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

// Socket instance
let socket: Socket | null = null;

// Connection status
export type SocketStatus = 'connected' | 'connecting' | 'disconnected' | 'error' | 'reconnecting';

// Listeners for connection status
const statusListeners: Set<(status: SocketStatus) => void> = new Set();

// Connection config
const MAX_RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_TIMEOUT = 5000; // 5 seconds initial timeout
const MAX_RECONNECTION_TIMEOUT = 30000; // Max 30 seconds between attempts
const RECONNECTION_ATTEMPTS = 5; // Max 5 reconnection attempts
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
let manuallyDisconnected = false;

/**
 * Initialize the socket connection
 */
export const initializeSocket = () => {
  if (socket) return socket;

  socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    path: '/socket.io',
    autoConnect: true,
    withCredentials: true,
    forceNew: true
  });

  // Handle connection errors with retry
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    if (socket && !socket.connected && reconnectAttempts < MAX_RECONNECTION_ATTEMPTS) {
      setTimeout(() => {
        reconnectAttempts++;
        socket?.connect();
      }, 2000);
    }
  });

  // Handle connection status events
  socket.on('connect', () => {
    updateStatus('connected');
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    console.log('Socket connected:', socket?.id);
  });

  socket.on('connecting', () => {
    updateStatus('connecting');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    updateStatus('disconnected');

    // Don't try to reconnect if we manually disconnected
    if (manuallyDisconnected) return;

    // Try to reconnect after a delay
    setTimeout(() => {
      if (socket && !socket.connected && reconnectAttempts < MAX_RECONNECTION_ATTEMPTS) {
        reconnectAttempts++;
        updateStatus('reconnecting');
        socket.connect();
      }
    }, 5000);

    // Set a timeout for reconnection
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        if (socket && !socket.connected) {
          updateStatus('error');
          // Emit a custom event that React components can listen to
          window.dispatchEvent(new CustomEvent('socket-connection-lost'));
        }
      }, RECONNECTION_TIMEOUT);
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    updateStatus('error');
    if (error.message.includes('Authentication failed')) {
      window.location.href = '/auth/login';
    }
  });

  return socket;
}

/**
 * Get the socket instance, creating it if necessary
 */
export function getSocket(): Socket {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
}

/**
 * Close the socket connection
 */
export function closeSocket() {
  if (socket) {
    manuallyDisconnected = true;
    socket.disconnect();
    socket = null;
  }
}

/**
 * Register a listener for connection status changes
 */
export function addStatusListener(listener: (status: SocketStatus) => void): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/**
 * Update the connection status and notify listeners
 */
function updateStatus(status: SocketStatus) {
  statusListeners.forEach(listener => listener(status));

  // Show toast notification for reconnecting status
  if (status === 'reconnecting') {
    const { toast } = useToast();
    toast({
      title: "Connection Interruption",
      description: "Real-time updates lost. Reconnecting...",
      variant: "warning",
    });
  }

  // Show banner for successful reconnection
  if (status === 'connected' && reconnectAttempts > 0) {
    const { toast } = useToast();
    toast({
      title: "Connection Restored",
      description: "You are now receiving real-time updates again.",
      variant: "success",
    });
  }
}