import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

interface TooltipProps extends React.ComponentProps<typeof TooltipPrimitive.Root> {
  /**
   * Delay in ms before showing the tooltip
   * @default 700
   */
  delayDuration?: number;
}

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = ({ 
  delayDuration = 700, 
  ...props 
}: TooltipProps) => {
  return (
    <TooltipPrimitive.Root 
      delayDuration={delayDuration} 
      {...props} 
    />
  )
}

interface TooltipTriggerProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger> {
  /**
   * Makes the trigger accessible to keyboard navigation
   * @default false
   */
  asChild?: boolean;
  
  /**
   * Adds tabindex attribute to make the element focusable
   * @default 0
   */
  tabIndex?: number;
}

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  TooltipTriggerProps
>(({ className, asChild = false, tabIndex = 0, ...props }, ref) => (
  <TooltipPrimitive.Trigger
    ref={ref}
    className={cn("inline-flex", className)}
    asChild={asChild}
    tabIndex={tabIndex}
    {...props}
  />
))
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  /**
   * Changes the visual style of the tooltip
   */
  variant?: "default" | "info" | "success" | "warning" | "error";
  
  /**
   * Controls the side property of the tooltip
   */
  side?: "top" | "right" | "bottom" | "left";
  
  /**
   * Controls the align property of the tooltip
   */
  align?: "start" | "center" | "end";
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ 
  className, 
  sideOffset = 4, 
  variant = "default",
  side,
  align,
  children,
  ...props 
}, ref) => {
  // Define variant styles
  const variantStyles = {
    default: "bg-[#F2A71B] border-[#F2A71B] text-white",
    info: "bg-blue-500 border-blue-600 text-white",
    success: "bg-green-500 border-green-600 text-white",
    warning: "bg-amber-500 border-amber-600 text-white",
    error: "bg-red-500 border-red-600 text-white"
  }
  
  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      side={side}
      align={align}
      aria-live="polite"
      role="tooltip"
      className={cn(
        "z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </TooltipPrimitive.Content>
  )
})
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
export type { TooltipProps, TooltipTriggerProps, TooltipContentProps }
