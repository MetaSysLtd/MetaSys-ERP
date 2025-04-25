import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/error-utils';
import { AlertTriangle, BadgeInfo, Ban, LucideIcon, RefreshCw, ServerCrash, Wifi, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export type ErrorType = 
  | 'api' 
  | 'network' 
  | 'server' 
  | 'auth' 
  | 'validation'
  | 'unknown';

interface ErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  error?: Error | null;
  type?: ErrorType;
  onRetry?: () => void;
}

function getErrorIcon(type: ErrorType): LucideIcon {
  switch (type) {
    case 'api':
      return BadgeInfo;
    case 'network':
      return Wifi;
    case 'server':
      return ServerCrash;
    case 'auth':
      return Ban;
    case 'validation':
      return XCircle;
    case 'unknown':
    default:
      return AlertTriangle;
  }
}

export function ErrorModal({
  open,
  onOpenChange,
  title,
  description,
  error,
  type = 'unknown',
  onRetry,
}: ErrorModalProps) {
  const message = error ? getErrorMessage(error) : description;
  const ErrorIcon = getErrorIcon(type);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ErrorIcon className="h-5 w-5 text-destructive" />
            <DialogTitle>{title || 'Error Occurred'}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {message || 'An unexpected error has occurred'}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-muted/50 p-3 rounded-md text-xs font-mono overflow-auto max-h-[200px]">
            {error.stack || error.message}
          </div>
        )}
        
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {onRetry && (
            <Button 
              onClick={() => {
                onRetry();
                onOpenChange(false);
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to use error modal
 */
export function useErrorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [errorState, setErrorState] = useState<{
    error: Error | null;
    type?: ErrorType;
    title?: string;
    description?: string;
    onRetry?: () => void;
  }>({
    error: null
  });
  
  const { toast } = useToast();
  
  const showError = ({
    error,
    type = 'unknown',
    title,
    description,
    onRetry,
    showToast = true
  }: {
    error?: Error;
    type?: ErrorType;
    title?: string;
    description?: string;
    onRetry?: () => void;
    showToast?: boolean;
  }) => {
    const errorMessage = error ? getErrorMessage(error) : description;
    
    // Update the error state
    setErrorState({
      error: error || null,
      type,
      title: title || getDefaultTitle(type),
      description: errorMessage,
      onRetry
    });
    
    // Show toast notification if requested
    if (showToast && errorMessage) {
      toast({
        title: title || getDefaultTitle(type),
        description: errorMessage,
        variant: 'destructive'
      });
    }
    
    // Open the modal
    setIsOpen(true);
  };
  
  const closeError = () => {
    setIsOpen(false);
  };
  
  // Helper function to get a default title based on error type
  function getDefaultTitle(type: ErrorType): string {
    switch (type) {
      case 'api':
        return 'API Error';
      case 'network':
        return 'Network Error';
      case 'server':
        return 'Server Error';
      case 'auth':
        return 'Authentication Error';
      case 'validation':
        return 'Validation Error';
      default:
        return 'Error';
    }
  }
  
  return {
    isErrorModalOpen: isOpen,
    errorModalState: errorState,
    showError,
    closeError,
    ErrorModalComponent: (
      <ErrorModal
        open={isOpen}
        onOpenChange={setIsOpen}
        error={errorState.error}
        type={errorState.type}
        title={errorState.title}
        description={errorState.description}
        onRetry={errorState.onRetry}
      />
    )
  };
}