import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block",
  {
    variants: {
      variant: {
        default: "",
        required: "after:content-['*'] after:ml-1 after:text-destructive dark:after:text-red-400",
        optional: "after:content-['(optional)'] after:ml-1 after:text-muted-foreground after:text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface LabelProps extends 
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
  VariantProps<typeof labelVariants> {
  /**
   * Whether the field this label is associated with is required
   */
  required?: boolean;
  
  /**
   * Whether to explicitly mark the field as optional
   */
  optional?: boolean;
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, variant, required, optional, ...props }, ref) => {
  // Determine the variant based on props
  let variantToUse = variant;
  if (required && !variant) {
    variantToUse = "required";
  } else if (optional && !variant) {
    variantToUse = "optional";
  }
  
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants({ variant: variantToUse }), className)}
      data-required={required ? true : undefined}
      // Add proper aria attributes
      aria-required={required ? true : undefined}
      {...props}
    />
  );
})
Label.displayName = LabelPrimitive.Root.displayName

export { Label, labelVariants }
export type { LabelProps }
