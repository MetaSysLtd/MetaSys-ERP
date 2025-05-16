import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

interface SwitchProps extends 
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
  VariantProps<typeof switchVariants> {
  /**
   * Label for the switch
   */
  label?: string;
  
  /**
   * Label for when the switch is on (for screen readers)
   */
  onLabel?: string;
  
  /**
   * Label for when the switch is off (for screen readers)
   */
  offLabel?: string;
  
  /**
   * Description text
   */
  description?: string;
  
  /**
   * Whether the label should be positioned on the right or left of the switch
   */
  labelPosition?: "left" | "right";
  
  /**
   * Size of the switch
   */
  size?: "sm" | "md" | "lg";
  
  /**
   * Error message
   */
  error?: string;
}

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A71B] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#F2A71B] data-[state=checked]:border-[#F2A71B] data-[state=unchecked]:bg-white data-[state=unchecked]:border-[#025E73]",
  {
    variants: {
      size: {
        sm: "h-4 w-8",
        md: "h-6 w-11",
        lg: "h-7 w-14"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
)

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-white border border-gray-300 shadow-md transition-transform data-[state=checked]:border-white data-[state=unchecked]:translate-x-0",
  {
    variants: {
      size: {
        sm: "h-3 w-3 data-[state=checked]:translate-x-4",
        md: "h-5 w-5 data-[state=checked]:translate-x-5",
        lg: "h-6 w-6 data-[state=checked]:translate-x-7"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
)

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ 
  className, 
  label, 
  onLabel = "Enabled", 
  offLabel = "Disabled",
  description,
  labelPosition = "right",
  size,
  error,
  ...props 
}, ref) => {
  // Generate unique ID for accessibility
  const id = React.useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  
  // Build the switch component
  const switchComponent = (
    <SwitchPrimitives.Root
      id={id}
      className={cn(switchVariants({ size }), className)}
      {...props}
      ref={ref}
      aria-labelledby={label ? `${id}-label` : undefined}
      aria-describedby={cn(descriptionId, errorId)}
      aria-invalid={error ? true : undefined}
    >
      <SwitchPrimitives.Thumb
        className={cn(thumbVariants({ size }))}
      />
      <span className="sr-only">
        {props.checked ? onLabel : offLabel}
      </span>
    </SwitchPrimitives.Root>
  );
  
  // If there's no label, just return the switch
  if (!label && !description && !error) {
    return switchComponent;
  }
  
  // Return switch with label, description and error message
  return (
    <div className="flex flex-col space-y-1.5">
      <div className={cn(
        "flex items-center gap-2",
        labelPosition === "left" ? "flex-row-reverse justify-end" : "flex-row"
      )}>
        {switchComponent}
        
        {label && (
          <label 
            id={`${id}-label`}
            htmlFor={id}
            className="text-sm font-medium cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
      
      {description && (
        <p 
          id={descriptionId}
          className="text-xs text-muted-foreground"
        >
          {description}
        </p>
      )}
      
      {error && (
        <p 
          id={errorId}
          className="text-xs text-destructive flex items-center gap-1"
          role="alert"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3 w-3">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
})
Switch.displayName = "Switch"

export { Switch }
export type { SwitchProps }