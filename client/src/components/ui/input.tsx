import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helpText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helpText, ...props }, ref) => {
    // Generate a unique ID for accessibility if one isn't provided
    const id = props.id || `input-${React.useId()}`;
    const helpTextId = helpText ? `${id}-description` : undefined;
    const hasError = error || props['aria-invalid'];
    
    // Set appropriate ARIA attributes for accessibility
    const ariaProps: Record<string, any> = {
      'aria-describedby': helpTextId || props['aria-describedby'],
    };
    
    // Mark as invalid if error is true
    if (hasError) {
      ariaProps['aria-invalid'] = true;
    }

    return (
      <div className="w-full space-y-1">
        <input
          id={id}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A71B] focus-visible:ring-offset-1",
            "focus:border-[#025E73] focus:shadow-[0_0_0_1px_rgba(2,94,115,0.1)]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
            hasError ? "border-destructive focus-visible:ring-destructive" : "border-input",
            "dark:bg-gray-800 dark:border-gray-700 dark:placeholder:text-gray-500 dark:focus:border-[#64D2E5]",
            className
          )}
          ref={ref}
          {...ariaProps}
          {...props}
        />
        {helpText && (
          <p
            id={helpTextId}
            className={cn(
              "text-xs px-1",
              hasError ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {helpText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
