import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    accent?: boolean, 
    accentPosition?: 'left' | 'top',
    interactive?: boolean
  }
>(({ className, accent = false, accentPosition = 'left', interactive = false, ...props }, ref) => {
  // Define accent border styling based on position
  const accentStyle = accent 
    ? accentPosition === 'left' 
      ? 'border-l-4 border-l-[#F2A71B]' 
      : 'border-t-4 border-t-[#F2A71B]'
    : '';
  
  // Define interactive card styling with hover and focus states
  const interactiveStyle = interactive 
    ? 'transition-all duration-200 hover:border-[#025E73]/70 hover:shadow-md focus:border-[#025E73] focus:shadow-md focus:outline-none focus:ring-1 focus:ring-[#025E73] focus:ring-offset-1'
    : '';
    
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-[#D6D6D6] bg-card text-card-foreground shadow-sm",
        accent && accentStyle,
        interactive && interactiveStyle,
        className
      )}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    />
  );
})
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
