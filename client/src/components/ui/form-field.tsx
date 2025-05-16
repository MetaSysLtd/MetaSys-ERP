import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "./label"

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Label for the form field
   */
  label?: string;
  
  /**
   * ID for the form field - used to associate label with input
   */
  id?: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Whether to show the field as optional
   */
  optional?: boolean;
  
  /**
   * Help text to provide additional guidance
   */
  helpText?: string;
  
  /**
   * Error message to display
   */
  error?: string | boolean;
  
  /**
   * Whether the field is disabled
   */
  disabled?: boolean;
  
  /**
   * Label to render instead of string
   */
  labelComponent?: React.ReactNode;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, children, label, id, required, optional, helpText, error, disabled, labelComponent, ...props }, ref) => {
    // Generate unique IDs for accessibility
    const fieldId = id || `field-${React.useId()}`;
    const helpTextId = helpText ? `${fieldId}-description` : undefined;
    const errorId = error && typeof error === 'string' ? `${fieldId}-error` : undefined;
    
    const errorMessage = typeof error === 'string' ? error : undefined;
    const hasError = !!error;
    
    return (
      <div 
        ref={ref}
        className={cn("mb-4 space-y-1.5", className)} 
        {...props}
      >
        {(label || labelComponent) && (
          labelComponent || (
            <Label 
              htmlFor={fieldId} 
              required={required} 
              optional={optional}
              className={cn(
                hasError && "text-destructive",
                disabled && "opacity-70"
              )}
            >
              {label}
            </Label>
          )
        )}
        
        {/* Wrap the child with ARIA attributes to connect it with label and help text */}
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              id: fieldId,
              'aria-describedby': cn(helpTextId, errorId),
              'aria-invalid': hasError || undefined,
              'aria-required': required || undefined,
              'aria-disabled': disabled || undefined,
              disabled: disabled || (child.props as any).disabled,
              ...((child.props as any).error === undefined ? { error: hasError } : {})
            });
          }
          return child;
        })}
        
        {helpText && !hasError && (
          <p
            id={helpTextId}
            className="text-xs text-muted-foreground px-1"
          >
            {helpText}
          </p>
        )}
        
        {errorMessage && (
          <p
            id={errorId}
            className="text-xs text-destructive flex items-center gap-1 px-1"
            role="alert"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3 w-3" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = "FormField"

export { FormField }