import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "./label"

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  /**
   * Label to display next to the checkbox
   */
  label?: string;
  
  /**
   * Description text to provide additional context
   */
  description?: string;
  
  /**
   * When true, renders the checkbox with an error style
   */
  error?: boolean;
  
  /**
   * Error message to display
   */
  errorMessage?: string;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, description, error, errorMessage, id, ...props }, ref) => {
  // Generate a unique ID for accessibility if one isn't provided
  const checkboxId = id || `checkbox-${React.useId()}`;
  const descriptionId = description ? `${checkboxId}-description` : undefined;
  const errorId = error && errorMessage ? `${checkboxId}-error` : undefined;
  
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <CheckboxPrimitive.Root
          ref={ref}
          id={checkboxId}
          className={cn(
            "peer h-5 w-5 shrink-0 rounded-sm border shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A71B] focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error 
              ? "border-destructive data-[state=checked]:bg-destructive" 
              : "border-[#025E73] data-[state=checked]:bg-[#025E73] data-[state=checked]:text-white",
            "dark:border-gray-600 dark:data-[state=checked]:bg-[#025E73]",
            className
          )}
          aria-describedby={cn(descriptionId, errorId)}
          aria-invalid={error}
          {...props}
        >
          <CheckboxPrimitive.Indicator
            className={cn("flex items-center justify-center text-current")}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        
        {label && (
          <Label 
            htmlFor={checkboxId} 
            className={cn(
              "text-sm leading-none cursor-pointer select-none",
              error && "text-destructive"
            )}
          >
            {label}
          </Label>
        )}
      </div>
      
      {description && (
        <p 
          id={descriptionId}
          className="text-xs text-muted-foreground ml-7"
        >
          {description}
        </p>
      )}
      
      {error && errorMessage && (
        <p 
          id={errorId}
          className="text-xs text-destructive ml-7 flex items-center gap-1"
          role="alert"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3 w-3">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {errorMessage}
        </p>
      )}
    </div>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
export type { CheckboxProps }
