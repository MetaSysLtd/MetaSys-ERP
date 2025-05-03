import React from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  AlertCircle, 
  XCircle, 
  Info,
  Network,
  RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Error severity levels
 */
export type ToastErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Props for the ToastError component
 */
export interface ToastErrorProps {
  /**
   * Error message to display
   */
  message: string;
  
  /**
   * The error severity level (affects icon and colors)
   */
  severity?: ToastErrorSeverity;
  
  /**
   * Text for the action button
   */
  actionLabel?: string;
  
  /**
   * Function to call when action button is clicked
   */
  onAction?: () => void;
  
  /**
   * Optional title (defaults based on severity if not provided)
   */
  title?: string;
}

/**
 * Show a toast with an error message
 * 
 * @param props Error configuration
 */
export function showToastError(props: ToastErrorProps): void {
  const { 
    message, 
    severity = 'error', 
    actionLabel, 
    onAction,
    title 
  } = props;
  
  // Determine icon based on severity
  let icon: React.ReactNode;
  let variant: 'default' | 'destructive' | 'success' = 'default';
  
  // Set default title based on severity
  let defaultTitle = '';
  
  switch (severity) {
    case 'info':
      icon = <Info className="h-5 w-5 text-blue-500" />;
      defaultTitle = 'Information';
      break;
    case 'warning':
      icon = <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      defaultTitle = 'Warning';
      break;
    case 'error':
      icon = <AlertCircle className="h-5 w-5 text-destructive" />;
      defaultTitle = 'Error';
      variant = 'destructive';
      break;
    case 'critical':
      icon = <XCircle className="h-5 w-5 text-destructive" />;
      defaultTitle = 'Critical Error';
      variant = 'destructive';
      break;
    default:
      icon = <AlertCircle className="h-5 w-5 text-destructive" />;
      defaultTitle = 'Error';
      variant = 'destructive';
  }
  
  // If there's an action, include a button in the toast
  const action = onAction && actionLabel ? (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        onAction();
      }}
      className="h-8 rounded-md px-3"
    >
      <RefreshCw className="mr-2 h-3.5 w-3.5" />
      {actionLabel}
    </Button>
  ) : undefined;
  
  // Show the toast with appropriate options
  toast({
    title: title || defaultTitle,
    description: message,
    variant: variant,
    duration: severity === 'critical' ? Infinity : 6000, // critical errors stay until dismissed
    action: action,
  });
}

/**
 * Show a network error toast
 * 
 * @param error The error object
 * @param retryFn Optional function to retry the operation
 */
export function showNetworkError(error: Error, retryFn?: () => void): void {
  showToastError({
    title: 'Network Error',
    message: 'Unable to connect to server. Please check your internet connection.',
    severity: 'error',
    actionLabel: retryFn ? 'Retry' : undefined,
    onAction: retryFn,
  });
}

/**
 * Show an authentication error toast
 * 
 * @param message Optional custom message (defaults to standard auth error message)
 */
export function showAuthError(message?: string): void {
  showToastError({
    title: 'Authentication Error',
    message: message || 'Your session has expired. Please log in again.',
    severity: 'warning',
  });
}