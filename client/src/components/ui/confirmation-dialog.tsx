import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, HelpCircle, Trash, CheckCircle2 } from 'lucide-react';

export type ConfirmationType = 
  | 'delete' 
  | 'warning' 
  | 'info' 
  | 'success' 
  | 'confirm';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  destructive?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  type = 'confirm',
  destructive = false,
  loading = false,
  children,
}: ConfirmationDialogProps) {
  // Get icon and button text based on type
  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash className="h-6 w-6 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'confirm':
      default:
        return <HelpCircle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getConfirmText = () => {
    if (confirmText) return confirmText;
    
    switch (type) {
      case 'delete':
        return 'Delete';
      case 'warning':
        return 'Continue';
      case 'info':
        return 'Acknowledge';
      case 'success':
        return 'Confirm';
      case 'confirm':
      default:
        return 'Confirm';
    }
  };

  const handleConfirm = () => {
    onConfirm();
    if (!loading) onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader className="flex flex-row items-start gap-4">
          <span className="mt-1 shrink-0">{getIcon()}</span>
          <div className="flex flex-col">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </div>
        </AlertDialogHeader>
        
        {children && <div className="py-4">{children}</div>}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={
              destructive 
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              getConfirmText()
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface UseConfirmationDialogProps {
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  destructive?: boolean;
}

/**
 * Hook to use confirmation dialog
 */
export function useConfirmationDialog({ 
  onConfirm, 
  title,
  description,
  confirmText,
  cancelText,
  type = 'confirm',
  destructive = false,
}: UseConfirmationDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const ConfirmationDialogComponent = () => (
    <ConfirmationDialog
      open={open}
      onOpenChange={setOpen}
      onConfirm={handleConfirm}
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText={cancelText}
      type={type}
      destructive={destructive}
      loading={loading}
    />
  );

  return {
    setOpen,
    ConfirmationDialogComponent,
  };
}

export default ConfirmationDialog;