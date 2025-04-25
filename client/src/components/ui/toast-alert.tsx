import * as React from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "relative flex w-full items-center justify-between rounded-md p-4 text-white shadow-md transition-all",
  {
    variants: {
      color: {
        red: "bg-[#C93131]",
        green: "bg-[#2EC4B6]",
      },
    },
    defaultVariants: {
      color: "green",
    },
  }
);

export interface ToastAlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof toastVariants> {
  children: React.ReactNode;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  icon?: React.ReactNode;
}

export const ToastAlert = React.forwardRef<HTMLDivElement, ToastAlertProps>(
  (
    {
      className,
      color,
      children,
      onClose,
      autoClose = true,
      autoCloseDelay = 5000,
      icon,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = React.useState(true);

    React.useEffect(() => {
      if (autoClose) {
        const timer = setTimeout(() => {
          setVisible(false);
          if (onClose) onClose();
        }, autoCloseDelay);

        return () => clearTimeout(timer);
      }
    }, [autoClose, autoCloseDelay, onClose]);

    if (!visible) return null;

    return (
      <div
        className={cn(toastVariants({ color: color as "red" | "green" }), className)}
        ref={ref}
        role="alert"
        {...props}
      >
        <div className="flex items-center gap-3">
          {icon || (color === "red" ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          ))}
          <span>{children}</span>
        </div>
        {onClose && (
          <button
            onClick={() => {
              setVisible(false);
              onClose();
            }}
            className="ml-2 rounded-full p-1 hover:bg-black/10 focus:outline-none"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

ToastAlert.displayName = "ToastAlert";