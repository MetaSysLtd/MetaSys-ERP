import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, Check, X, Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm ring-offset-background transition-colors",
  {
    variants: {
      size: {
        sm: "h-8 text-xs px-2.5",
        md: "h-10 text-sm",
        lg: "h-12 text-base px-4",
      },
      variant: {
        default: "border-input",
        outline: "border-2 border-input",
        ghost: "border-none shadow-none bg-transparent",
        flushed: "border-t-0 border-l-0 border-r-0 rounded-none border-b-2 border-input px-0",
      },
      state: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive text-destructive placeholder:text-destructive/50",
        success: "border-green-500 focus-visible:ring-green-500 text-green-600",
        warning: "border-yellow-500 focus-visible:ring-yellow-500 text-yellow-600",
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default",
      state: "default"
    }
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'state'>,
    VariantProps<typeof inputVariants> {
  /**
   * Error state and optional error message
   */
  error?: boolean | string;
  
  /**
   * Success state and optional success message
   */
  success?: boolean | string;
  
  /**
   * Warning state and optional warning message
   */
  warning?: boolean | string;
  
  /**
   * Help text to display below the input
   */
  helpText?: string;
  
  /**
   * Add a leading icon inside the input
   */
  leadingIcon?: React.ReactNode;
  
  /**
   * Add a trailing icon inside the input
   */
  trailingIcon?: React.ReactNode;
  
  /**
   * Add a clear button to the input
   */
  clearable?: boolean;
  
  /**
   * Callback for clear button
   */
  onClear?: () => void;
  
  /**
   * Apply full width to input container
   */
  fullWidth?: boolean;
  
  /**
   * For password inputs, toggle visibility
   */
  showPassword?: boolean;
  
  /**
   * For password inputs, callback to toggle visibility
   */
  onTogglePassword?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    type,
    error,
    success,
    warning,
    helpText,
    size,
    variant,
    state: propState,
    leadingIcon,
    trailingIcon,
    clearable,
    onClear,
    fullWidth = true,
    showPassword,
    onTogglePassword,
    ...props 
  }, ref) => {
    // Determine state based on props
    let state = propState;
    if (error && !state) state = "error";
    else if (success && !state) state = "success";
    else if (warning && !state) state = "warning";
    
    // Message can be string or boolean
    const errorMessage = typeof error === "string" ? error : undefined;
    const successMessage = typeof success === "string" ? success : undefined;
    const warningMessage = typeof warning === "string" ? warning : undefined;
    
    // Show status message based on state
    const statusMessage = errorMessage || successMessage || warningMessage || helpText;
    
    // Generate a unique ID for accessibility if one isn't provided
    const id = props.id || `input-${React.useId()}`;
    const helpTextId = statusMessage ? `${id}-description` : undefined;
    
    // Set appropriate ARIA attributes for accessibility
    const ariaProps: Record<string, any> = {
      'aria-describedby': helpTextId || props['aria-describedby'],
    };
    
    // Mark as invalid if error is true or an error message is provided
    if (error) {
      ariaProps['aria-invalid'] = true;
    }

    // Handle password visibility toggle
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;
    
    // Handle clear button
    const handleClear = () => {
      if (onClear) {
        onClear();
      }
    };
    
    // Handle password toggle
    const handleTogglePassword = () => {
      if (onTogglePassword) {
        onTogglePassword();
      }
    };
    
    // Right icon logic
    const renderRightIcon = () => {
      if (isPassword) {
        return (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={handleTogglePassword}
            tabIndex={-1} // prevent focus trap but still allow click
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        );
      }
      
      if (clearable && props.value) {
        return (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={handleClear}
            tabIndex={-1} // prevent focus trap but still allow click
            aria-label="Clear input"
          >
            <X className="h-4 w-4" />
          </button>
        );
      }
      
      return trailingIcon ? (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {trailingIcon}
        </span>
      ) : null;
    };
    
    // Status icon logic (appears in the help text area)
    const statusIcon = () => {
      if (error) return <AlertCircle className="h-3 w-3" />;
      if (success) return <Check className="h-3 w-3" />;
      if (warning) return <AlertCircle className="h-3 w-3" />;
      return null;
    };

    // Define status text color based on state
    const statusTextColor = {
      error: "text-destructive",
      success: "text-green-600",
      warning: "text-yellow-600",
      default: "text-muted-foreground"
    }[state || "default"];

    return (
      <div className={cn("space-y-1.5", fullWidth ? "w-full" : "w-auto")}>
        <div className="relative">
          {leadingIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leadingIcon}
            </span>
          )}
          
          <input
            id={id}
            type={inputType}
            className={cn(
              inputVariants({ size, variant, state }),
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A71B] focus-visible:ring-offset-1",
              "focus:border-[#025E73] focus:shadow-[0_0_0_1px_rgba(2,94,115,0.1)]",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
              "dark:bg-gray-800 dark:border-gray-700 dark:placeholder:text-gray-500 dark:focus:border-[#64D2E5]",
              leadingIcon && "pl-10",
              (trailingIcon || clearable || isPassword) && "pr-10",
              className
            )}
            ref={ref}
            {...ariaProps}
            {...props}
          />
          
          {renderRightIcon()}
        </div>
        
        {statusMessage && (
          <p
            id={helpTextId}
            className={cn(
              "text-xs px-1 flex items-center gap-1.5",
              statusTextColor
            )}
            role={error ? "alert" : undefined}
          >
            {statusIcon()}
            {statusMessage}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
