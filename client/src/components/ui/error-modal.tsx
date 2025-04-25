import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createUserFriendlyErrorMessage, formatErrorMessage } from '@/lib/error-utils';

interface ErrorModalProps {
  open: boolean;
  onClose: () => void;
  error: Error | string | null | unknown;
  title?: string;
  description?: string;
  showDetails?: boolean;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * A reusable modal component for displaying errors with configurable details and actions
 */
export function ErrorModal({
  open,
  onClose,
  error,
  title = "An Error Occurred",
  description = "We encountered a problem while processing your request.",
  showDetails = true,
  primaryAction,
  secondaryAction,
}: ErrorModalProps) {
  const errorMessage = error
    ? createUserFriendlyErrorMessage(error)
    : "Unknown error";

  const formattedError = formatErrorMessage(error);
  
  // Get stack trace if available
  const stack = error instanceof Error ? error.stack : null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex items-center">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle className="font-medium">{errorMessage}</AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              {formattedError}
            </AlertDescription>
          </Alert>
          
          {showDetails && stack && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Technical Details</h4>
              <ScrollArea className="h-[100px]">
                <pre className="text-xs bg-muted p-2 rounded overflow-auto whitespace-pre-wrap">
                  {stack}
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className="mt-2 sm:mt-0"
            >
              {secondaryAction.label}
            </Button>
          )}
          <Button
            onClick={primaryAction ? primaryAction.onClick : onClose}
            className="bg-destructive hover:bg-destructive/90"
          >
            {primaryAction ? primaryAction.label : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useErrorModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [errorState, setErrorState] = React.useState<{
    error: Error | string | null | unknown;
    title?: string;
    description?: string;
    showDetails?: boolean;
    primaryAction?: {
      label: string;
      onClick: () => void;
    };
    secondaryAction?: {
      label: string;
      onClick: () => void;
    };
  }>({
    error: null,
  });

  const showError = (
    error: Error | string | unknown,
    options?: {
      title?: string;
      description?: string;
      showDetails?: boolean;
      primaryAction?: {
        label: string;
        onClick: () => void;
      };
      secondaryAction?: {
        label: string;
        onClick: () => void;
      };
    }
  ) => {
    setErrorState({
      error,
      ...options,
    });
    setIsOpen(true);
  };

  const closeError = () => {
    setIsOpen(false);
  };

  const ErrorModalComponent = () => (
    <ErrorModal
      open={isOpen}
      onClose={closeError}
      error={errorState.error}
      title={errorState.title}
      description={errorState.description}
      showDetails={errorState.showDetails}
      primaryAction={errorState.primaryAction}
      secondaryAction={errorState.secondaryAction}
    />
  );

  return {
    showError,
    closeError,
    ErrorModal: ErrorModalComponent,
  };
}

export default ErrorModal;