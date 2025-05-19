import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

interface ProgressProps extends 
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
  VariantProps<typeof progressVariants> {
  /**
   * Current progress value between 0 and 100
   */
  value?: number;
  
  /**
   * Maximum possible value, defaults to 100
   */
  max?: number;
  
  /**
   * Label for screen readers
   */
  label?: string;
  
  /**
   * Size of the progress bar
   */
  size?: "sm" | "md" | "lg";
  
  /**
   * Color of the progress indicator
   */
  color?: "default" | "success" | "info" | "warning" | "danger";
  
  /**
   * Whether to show the value label
   */
  showValueLabel?: boolean;
  
  /**
   * Text format to display as value label
   */
  valueLabel?: string;
}

const progressVariants = cva(
  "relative overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      size: {
        sm: "h-2",
        md: "h-4",
        lg: "h-6"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
)

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 transition-all",
  {
    variants: {
      color: {
        default: "bg-[#025E73]",
        success: "bg-green-500",
        info: "bg-blue-500",
        warning: "bg-[#F2A71B]",
        danger: "bg-destructive"
      }
    },
    defaultVariants: {
      color: "default"
    }
  }
)

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value, 
  max = 100,
  label,
  size,
  color,
  showValueLabel = false,
  valueLabel,
  ...props 
}, ref) => {
  // Check for NaN, undefined, or null and handle safely
  const safeValue = (value === undefined || value === null || isNaN(value)) ? 0 : value;
  const percentage = Math.min(Math.max(0, safeValue), max);
  const displayValue = Math.round((percentage / max) * 100);
  
  // Format for the valueLabel, with fallbacks
  const valueLabelText = valueLabel 
    ? valueLabel.replace('{value}', String(percentage))
                .replace('{max}', String(max))
                .replace('{percent}', String(displayValue))
    : `${displayValue}%`;

  return (
    <div className="flex flex-col space-y-1.5">
      {showValueLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span aria-hidden="true">{valueLabelText}</span>
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(progressVariants({ size }), className)}
        value={percentage}
        max={max}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(progressIndicatorVariants({ color }))}
          style={{ transform: `translateX(-${100 - displayValue}%)` }}
        />
      </ProgressPrimitive.Root>
      {/* Hidden text for screen readers */}
      <span className="sr-only" role="status" aria-live="polite">
        {label ? `${label}: ` : ''}{valueLabelText}
      </span>
    </div>
  );
})
Progress.displayName = "Progress"

export { Progress }
export type { ProgressProps }
