import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A71B] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden aria-disabled:opacity-50 aria-disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-[#025E73] text-white hover:bg-[#011F26] active:bg-[#025E73]/90 dark:bg-[#025E73] dark:text-white dark:hover:bg-[#011F26] dark:active:bg-[#025E73]/90 text-sm sm:text-base px-3 sm:px-4 hover:shadow-md active:shadow-inner [&_svg]:text-white [&_svg]:h-4 [&_svg]:w-4 [&_svg]:mr-2 gap-2",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/100 dark:bg-destructive dark:text-white dark:hover:bg-destructive/90 dark:active:bg-destructive/100 text-sm sm:text-base px-3 sm:px-4 hover:shadow-md active:shadow-inner [&_svg]:text-white [&_svg]:h-4 [&_svg]:w-4 [&_svg]:mr-2 gap-2",
        outline:
          "border border-[#025E73] bg-background text-[#025E73] hover:bg-[#025E73]/5 active:bg-[#025E73]/10 dark:border-[#025E73] dark:bg-background dark:text-[#025E73] dark:hover:bg-[#025E73]/20 dark:active:bg-[#025E73]/30 text-sm sm:text-base px-3 sm:px-4 hover:shadow-md active:shadow-inner [&_svg]:text-[#025E73] [&_svg]:h-4 [&_svg]:w-4 [&_svg]:mr-2 gap-2",
        secondary:
          "bg-[#F2A71B] text-white hover:bg-[#E09616] active:bg-[#D18613] dark:bg-[#F2A71B] dark:text-white dark:hover:bg-[#E09616] dark:active:bg-[#D18613] text-sm sm:text-base px-3 sm:px-4 hover:shadow-md active:shadow-inner [&_svg]:text-white [&_svg]:h-4 [&_svg]:w-4 [&_svg]:mr-2 gap-2",
        ghost: "hover:bg-[#025E73]/10 hover:text-[#025E73] active:bg-[#025E73]/20 dark:hover:bg-[#025E73]/20 dark:hover:text-[#025E73] dark:active:bg-[#025E73]/30 text-sm sm:text-base px-3 sm:px-4 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:mr-2 gap-2",
        link: "text-[#025E73] underline-offset-4 hover:underline hover:text-[#011F26] active:text-[#412754] dark:text-[#64D2E5] dark:hover:text-[#88E1F2] dark:active:text-[#B8F0FF] text-sm sm:text-base px-3 sm:px-4 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:mr-2 gap-2",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10 p-2 [&_svg]:mr-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Ensure buttons always have proper aria attributes for accessibility
    const ariaProps: Record<string, string> = {}
    
    // If there's no aria-label and no children text, warn in dev and try to use title
    if (process.env.NODE_ENV !== 'production') {
      if (!props.children && !props['aria-label'] && !props['aria-labelledby']) {
        console.warn(
          'Button is missing aria-label or text content. ' +
          'Buttons should have descriptive text or an aria-label for screen readers.'
        )
        
        // If title exists, use it as an aria-label
        if (props.title) {
          ariaProps['aria-label'] = props.title
        }
      }
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        role={asChild ? undefined : "button"}
        tabIndex={props.disabled ? -1 : props.tabIndex ?? 0}
        {...ariaProps}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }