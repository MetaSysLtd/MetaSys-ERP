import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown, Circle, CheckCircle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Create a context to pass data from AccordionItem to its children
interface AccordionItemContextType {
  status?: "default" | "pending" | "completed" | "error";
  disabled?: boolean;
}

const AccordionItemContext = React.createContext<AccordionItemContextType | null>(null);

// Use the native AccordionSingleProps or AccordionMultipleProps from Radix
type AccordionElementProps = React.ComponentPropsWithRef<typeof AccordionPrimitive.Root>;

// Use the direct Accordion primitive to avoid type issues
const Accordion = AccordionPrimitive.Root
Accordion.displayName = "Accordion"

const accordionItemVariants = cva(
  "focus-within:relative focus-within:z-10",
  {
    variants: {
      variant: {
        default: "border-b",
        card: "rounded-md border shadow-sm mb-2 overflow-hidden",
        ghost: "border-none",
      },
      disabled: {
        true: "opacity-60 pointer-events-none",
        false: "",
      },
      status: {
        default: "",
        pending: "border-l-4 border-l-yellow-500",
        completed: "border-l-4 border-l-green-500",
        error: "border-l-4 border-l-red-500",
      },
    },
    defaultVariants: {
      variant: "default",
      disabled: false,
      status: "default",
    },
  }
)

interface AccordionItemProps 
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>,
    VariantProps<typeof accordionItemVariants> {
  /**
   * Whether the item is disabled
   */
  disabled?: boolean;
  
  /**
   * Status of the item - can be used to apply different styles
   */
  status?: "default" | "pending" | "completed" | "error";
  
  /**
   * A badge or icon to show next to the trigger
   */
  badge?: React.ReactNode;
}

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, variant, disabled, status, badge, ...props }, ref) => {
  const contextValue = React.useMemo(() => ({ status, disabled }), [status, disabled]);
  
  return (
    <AccordionItemContext.Provider value={contextValue}>
      <AccordionPrimitive.Item
        ref={ref}
        className={cn(accordionItemVariants({ variant, disabled, status }), className)}
        data-status={status}
        data-disabled={disabled}
        aria-disabled={disabled}
        {...props}
      />
    </AccordionItemContext.Provider>
  );
})
AccordionItem.displayName = "AccordionItem"

const accordionTriggerVariants = cva(
  "flex items-center justify-between py-4 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A71B] focus-visible:ring-offset-1 focus:text-[#025E73] disabled:cursor-not-allowed disabled:opacity-50 text-left",
  {
    variants: {
      variant: {
        default: "hover:underline",
        card: "px-4 py-3 bg-muted/40 hover:bg-muted",
        ghost: "hover:bg-muted/20",
      },
      size: {
        sm: "text-sm py-2",
        default: "text-base py-4",
        lg: "text-lg py-5",
      },
      withIcon: {
        true: "gap-2",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      withIcon: false,
    },
  }
)

interface AccordionTriggerProps 
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>,
    Omit<VariantProps<typeof accordionTriggerVariants>, 'withIcon'> {
  /**
   * Hide the chevron icon
   */
  hideChevron?: boolean;
  
  /**
   * An icon to display before the trigger text
   */
  icon?: React.ReactNode;
  
  /**
   * A badge or counter to display alongside the trigger
   */
  badge?: React.ReactNode;
  
  /**
   * Actions to display on the right side (will push chevron further right)
   */
  actions?: React.ReactNode;
  
  /**
   * Use an alternative indicator for status
   */
  useStatusIcon?: boolean;
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ 
  className, 
  children, 
  hideChevron, 
  icon, 
  badge, 
  actions,
  useStatusIcon,
  variant,
  size,
  ...props 
}, ref) => {
  const withIcon = !!icon;
  const item = React.useContext(AccordionItemContext);
  const status = item?.status || 'default';
  
  // Generate appropriate status icon
  const statusIcon = React.useMemo(() => {
    if (!useStatusIcon) return null;
    
    switch (status) {
      case 'pending':
        return <Circle className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <Circle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  }, [status, useStatusIcon]);
  
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          accordionTriggerVariants({ variant, size, withIcon }),
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          {statusIcon}
          {icon}
          <span>{children}</span>
          {badge && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal">
              {badge}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {actions && (
            <div 
              className="flex items-center" 
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                }
              }}
            >
              {actions}
            </div>
          )}
          {!hideChevron && (
            <ChevronDown 
              className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" 
              aria-hidden="true"
            />
          )}
        </div>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = "AccordionTrigger"

const accordionContentVariants = cva(
  "overflow-hidden text-sm transition-all",
  {
    variants: {
      animate: {
        true: "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        false: "",
      },
      padding: {
        none: "p-0",
        sm: "p-2",
        default: "pb-4 pt-0 px-0",
        card: "p-4",
      },
    },
    defaultVariants: {
      animate: true,
      padding: "default",
    },
  }
)

interface AccordionContentProps 
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>,
    VariantProps<typeof accordionContentVariants> {
  /**
   * Whether to animate the opening/closing transitions
   */
  animate?: boolean;
  
  /**
   * The padding to apply to the content
   */
  padding?: "none" | "sm" | "default" | "card";
  
  /**
   * Whether to include a loading indicator
   */
  loading?: boolean;
  
  /**
   * Error message to display if content failed to load
   */
  error?: string;
}

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ 
  className, 
  children, 
  animate,
  padding,
  loading,
  error,
  ...props 
}, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(accordionContentVariants({ animate, padding }), className)}
    {...props}
  >
    {loading ? (
      <div className="flex items-center justify-center py-8" aria-live="polite" aria-label="Loading content">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    ) : error ? (
      <div className="flex flex-col items-center justify-center py-8 text-destructive" role="alert">
        <span className="mb-2 text-xl">⚠️</span>
        <p>{error}</p>
      </div>
    ) : (
      <div className={className}>{children}</div>
    )}
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = "AccordionContent"

export { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
}

export type {
  AccordionElementProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps
}