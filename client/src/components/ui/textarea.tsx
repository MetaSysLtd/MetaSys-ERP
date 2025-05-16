import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, Check } from "lucide-react"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm ring-offset-background transition-colors",
  {
    variants: {
      variant: {
        default: "border-input",
        outline: "border-2 border-input",
        ghost: "border-none shadow-none bg-transparent",
      },
      state: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive text-destructive placeholder:text-destructive/50",
        success: "border-green-500 focus-visible:ring-green-500 text-green-600",
        warning: "border-yellow-500 focus-visible:ring-yellow-500 text-yellow-600",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize",
      }
    },
    defaultVariants: {
      variant: "default",
      state: "default",
      resize: "vertical",
    }
  }
)

export interface TextareaProps 
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'state'>,
    VariantProps<typeof textareaVariants> {
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
   * Help text to display below the textarea
   */
  helpText?: string;
  
  /**
   * Minimum and maximum height for auto-growing textarea
   */
  autoGrow?: boolean;
  
  /**
   * Maximum height for auto-growing textarea
   * Only used when autoGrow is true
   */
  maxHeight?: number;
  
  /**
   * Counter for character limit
   * Shows character count when true
   */
  showCount?: boolean;
  
  /**
   * Apply full width to textarea container
   */
  fullWidth?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    error,
    success,
    warning,
    helpText,
    variant,
    state: propState,
    resize,
    autoGrow = false,
    maxHeight,
    showCount = false,
    fullWidth = true,
    maxLength,
    ...props 
  }, ref) => {
    // Create a local ref to handle auto-growing
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [count, setCount] = React.useState(0);
    
    // Connect our ref to the forwarded ref
    React.useImperativeHandle(ref, () => textareaRef.current!);
    
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
    const id = props.id || `textarea-${React.useId()}`;
    const helpTextId = statusMessage ? `${id}-description` : undefined;
    
    // Set appropriate ARIA attributes for accessibility
    const ariaProps: Record<string, any> = {
      'aria-describedby': helpTextId || props['aria-describedby'],
    };
    
    // Mark as invalid if error is true or an error message is provided
    if (error) {
      ariaProps['aria-invalid'] = true;
    }
    
    // Auto-grow functionality
    const adjustHeight = React.useCallback(() => {
      if (!autoGrow || !textareaRef.current) return;
      
      // Reset height to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      
      // Calculate new height
      let newHeight = textareaRef.current.scrollHeight;
      
      // Apply max height if specified
      if (maxHeight && newHeight > maxHeight) {
        newHeight = maxHeight;
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
      
      textareaRef.current.style.height = `${newHeight}px`;
    }, [autoGrow, maxHeight]);
    
    // Update character count
    const updateCount = React.useCallback(() => {
      if (!textareaRef.current) return;
      setCount(textareaRef.current.value.length);
    }, []);
    
    // Handle input events for auto-grow and character count
    const handleInput = React.useCallback(() => {
      adjustHeight();
      updateCount();
    }, [adjustHeight, updateCount]);
    
    // Set initial height and count
    React.useEffect(() => {
      if (textareaRef.current) {
        adjustHeight();
        updateCount();
      }
    }, [adjustHeight, updateCount]);
    
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
        <textarea
          id={id}
          ref={textareaRef}
          className={cn(
            textareaVariants({ variant, state, resize }),
            "min-h-[80px]",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A71B] focus-visible:ring-offset-1",
            "focus:border-[#025E73] focus:shadow-[0_0_0_1px_rgba(2,94,115,0.1)]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
            "dark:bg-gray-800 dark:border-gray-700 dark:placeholder:text-gray-500 dark:focus:border-[#64D2E5]",
            className
          )}
          onInput={handleInput}
          {...ariaProps}
          {...props}
        />
        
        <div className="flex justify-between items-center px-1">
          {statusMessage && (
            <p
              id={helpTextId}
              className={cn(
                "text-xs flex items-center gap-1.5",
                statusTextColor
              )}
              role={error ? "alert" : undefined}
            >
              {statusIcon()}
              {statusMessage}
            </p>
          )}
          
          {showCount && maxLength && (
            <p className={cn(
              "text-xs text-muted-foreground ml-auto",
              count > (maxLength * 0.9) && "text-amber-500",
              count >= maxLength && "text-destructive"
            )}>
              {count}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
