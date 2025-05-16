import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

interface CardProps extends 
  React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof cardVariants> {
  /**
   * Adds an accent border to the card
   */
  accent?: boolean;
  
  /**
   * Position of the accent border
   */
  accentPosition?: 'left' | 'top' | 'right' | 'bottom';
  
  /**
   * Color of the accent border
   */
  accentColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  
  /**
   * Makes the card interactive (clickable)
   */
  interactive?: boolean;
  
  /**
   * Makes the card look like it's in a loading state
   */
  loading?: boolean;
  
  /**
   * Makes the card look disabled
   */
  disabled?: boolean;
  
  /**
   * Renders the card as a specific HTML element
   * @default "div"
   */
  as?: React.ElementType;
}

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        outline: "shadow-none",
        ghost: "border-none shadow-none bg-transparent",
        elevated: "shadow-md",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-6",
        lg: "p-8",
      },
      width: {
        auto: "w-auto",
        full: "w-full",
      },
      radius: {
        default: "rounded-lg",
        sm: "rounded-md",
        lg: "rounded-xl",
        none: "rounded-none",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "none",
      width: "full",
      radius: "default",
    }
  }
)

// Accent color mapping
const accentColorMap = {
  primary: "border-[#025E73]",
  secondary: "border-[#F2A71B]",
  success: "border-green-500",
  warning: "border-amber-500",
  danger: "border-destructive",
  info: "border-blue-500",
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    accent = false, 
    accentPosition = 'left', 
    accentColor = 'secondary',
    interactive = false,
    loading = false,
    disabled = false,
    variant,
    padding,
    width,
    radius,
    as: Component = "div",
    ...props 
  }, ref) => {
    // Define accent border styling based on position and color
    const accentStyle = accent ? {
      'left': `border-l-4 ${accentColorMap[accentColor].replace('border-', 'border-l-')}`,
      'top': `border-t-4 ${accentColorMap[accentColor].replace('border-', 'border-t-')}`,
      'right': `border-r-4 ${accentColorMap[accentColor].replace('border-', 'border-r-')}`,
      'bottom': `border-b-4 ${accentColorMap[accentColor].replace('border-', 'border-b-')}`,
    }[accentPosition] : '';
    
    return (
      <Component
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, width, radius }),
          accent && accentStyle,
          interactive && "cursor-pointer transition-all hover:shadow-md hover:translate-y-[-2px]",
          disabled && "opacity-60 pointer-events-none",
          loading && "animate-pulse",
          className
        )}
        {...(interactive ? { tabIndex: 0, role: "button" } : {})}
        aria-disabled={disabled}
        aria-busy={loading}
        {...props}
      />
    );
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
