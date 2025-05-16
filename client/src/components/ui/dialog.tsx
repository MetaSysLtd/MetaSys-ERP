import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

interface DialogProps extends React.ComponentProps<typeof DialogPrimitive.Root> {
  /**
   * Called when the escape key is pressed or the overlay is clicked
   */
  onOpenChange?: (open: boolean) => void;
}

const Dialog = DialogPrimitive.Root

interface DialogTriggerProps extends React.ComponentProps<typeof DialogPrimitive.Trigger> {
  /**
   * Accessible label for the dialog trigger button if no visible text is provided
   */
  ariaLabel?: string;
}

const DialogTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  DialogTriggerProps
>(({ className, ariaLabel, children, ...props }, ref) => (
  <DialogPrimitive.Trigger 
    ref={ref}
    className={cn("inline-flex items-center justify-center", className)}
    aria-label={ariaLabel}
    {...props}
  >
    {children}
  </DialogPrimitive.Trigger>
))
DialogTrigger.displayName = "DialogTrigger"

const DialogPortal = DialogPrimitive.Portal

interface DialogCloseProps extends React.ComponentProps<typeof DialogPrimitive.Close> {
  /**
   * Accessible label for the close button if no visible text is provided
   */
  ariaLabel?: string;
}

const DialogClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  DialogCloseProps
>(({ className, ariaLabel, children, ...props }, ref) => (
  <DialogPrimitive.Close
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-sm",
      "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A71B] focus-visible:ring-offset-1",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    aria-label={ariaLabel || "Close dialog"}
    {...props}
  >
    {children}
  </DialogPrimitive.Close>
))
DialogClose.displayName = "DialogClose"

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /**
   * Whether to show the close button
   * @default true
   */
  showCloseButton?: boolean;
  
  /**
   * Whether the dialog should have a max width
   * @default true
   */
  maxWidth?: boolean;
  
  /**
   * Size of the dialog
   * @default "default"
   */
  size?: "sm" | "default" | "lg" | "xl" | "full";
  
  /**
   * Whether to disable the animations
   */
  disableAnimation?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ 
  className, 
  children, 
  showCloseButton = true, 
  maxWidth = true, 
  size = "default",
  disableAnimation = false,
  ...props 
}, ref) => {
  // Define size classes
  const sizeClasses = {
    sm: "max-w-sm",
    default: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[calc(100%-2rem)]"
  }
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%]",
          maxWidth && sizeClasses[size],
          "gap-4 border bg-background p-6 shadow-lg",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A71B] focus-visible:ring-offset-1",
          !disableAnimation && [
            "duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          ],
          "sm:rounded-lg",
          className
        )}
        aria-modal="true"
        role="dialog"
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:ring-offset-background">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left mb-4",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2 mt-4",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

export type {
  DialogProps,
  DialogTriggerProps,
  DialogCloseProps,
  DialogContentProps,
}
