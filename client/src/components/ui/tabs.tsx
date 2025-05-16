import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  /**
   * Orientation of the tabs, horizontal or vertical
   */
  orientation?: "horizontal" | "vertical";
  
  /**
   * Label that describes the purpose of the tabs for screen readers
   */
  ariaLabel?: string;
}

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ orientation = "horizontal", ariaLabel, className, children, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    orientation={orientation}
    className={cn(
      orientation === "vertical" && "flex flex-row space-x-2",
      className
    )}
    aria-label={ariaLabel}
    {...props}
  >
    {children}
  </TabsPrimitive.Root>
))
Tabs.displayName = "Tabs"

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  /**
   * Visual appearance of the tabs list
   */
  variant?: "default" | "outline" | "underline" | "pills";
  
  /**
   * Size of the tabs list
   */
  size?: "sm" | "default" | "lg";
  
  /**
   * Whether the tabs list should take the full width
   */
  fullWidth?: boolean;
}

const tabsListVariants = cva(
  "flex items-center justify-center rounded-md text-muted-foreground",
  {
    variants: {
      variant: {
        default: "bg-muted p-1",
        outline: "border border-input bg-transparent",
        underline: "border-b border-input bg-transparent",
        pills: "bg-transparent gap-2"
      },
      size: {
        sm: "h-8 text-xs",
        default: "h-10 text-sm",
        lg: "h-12 text-base"
      },
      fullWidth: {
        true: "w-full",
        false: "w-max"
      },
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
      orientation: "horizontal"
    }
  }
)

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps & { orientation?: "horizontal" | "vertical" }
>(({ 
  className, 
  variant, 
  size, 
  fullWidth,
  orientation = "horizontal",
  ...props 
}, ref) => {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        tabsListVariants({ variant, size, fullWidth, orientation }),
        className
      )}
      {...props}
    />
  )
})
TabsList.displayName = "TabsList"

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  /**
   * Icon to display alongside the label
   */
  icon?: React.ReactNode;
  
  /**
   * Badge or counter to display alongside the label
   */
  badge?: React.ReactNode;
  
  /**
   * Indicates that this tab is disabled
   */
  disabled?: boolean;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, children, icon, badge, disabled, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A71B] focus-visible:ring-offset-1",
      "hover:bg-muted/50 hover:text-foreground",
      "data-[state=active]:bg-[#F2A71B] data-[state=active]:text-[#011F26] data-[state=active]:shadow-sm",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    disabled={disabled}
    {...props}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    <span>{children}</span>
    {badge && <span className="ml-auto shrink-0">{badge}</span>}
  </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  /**
   * Adds a loading state to the content panel
   */
  loading?: boolean;
  
  /**
   * Error message to display if content failed to load
   */
  error?: string;
  
  /**
   * Padding for the content panel
   */
  padding?: "none" | "sm" | "md" | "lg";
}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ 
  className, 
  children, 
  loading, 
  error,
  padding = "none",
  ...props 
}, ref) => {
  const paddingClasses = {
    none: "",
    sm: "p-2",
    md: "p-4",
    lg: "p-6"
  }
  
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A71B] focus-visible:ring-offset-1",
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center py-8" aria-live="polite" aria-label="Loading content">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 text-destructive" role="alert">
          <span className="mb-2 text-5xl">⚠️</span>
          <p>{error}</p>
        </div>
      ) : (
        children
      )}
    </TabsPrimitive.Content>
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps }
