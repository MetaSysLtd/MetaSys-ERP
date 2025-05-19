import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A71B] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden gap-2",
  {
    variants: {
      variant: {
        default: "bg-[#025E73] text-white hover:bg-[#025E73]/90 active:bg-[#025E73]/80 dark:bg-[#025E73] dark:text-white dark:hover:bg-[#025E73]/90 [&_svg]:text-white [&_svg]:size-4",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/80 dark:bg-destructive dark:text-white dark:hover:bg-destructive/90 [&_svg]:text-white [&_svg]:size-4",
        outline:
          "border border-[#025E73] bg-transparent text-[#025E73] hover:bg-[#025E73]/5 active:bg-[#025E73]/10 dark:border-[#025E73] dark:bg-transparent dark:text-[#025E73] dark:hover:bg-[#025E73]/10 [&_svg]:text-[#025E73] [&_svg]:size-4",
        secondary:
          "bg-[#F2A71B] text-white hover:bg-[#F2A71B]/90 active:bg-[#F2A71B]/80 dark:bg-[#F2A71B] dark:text-white dark:hover:bg-[#F2A71B]/90 [&_svg]:text-white [&_svg]:size-4",
        ghost: "bg-transparent text-foreground hover:text-[#025E73] hover:bg-[#025E73]/5 active:bg-[#025E73]/10 dark:text-foreground dark:hover:text-[#025E73] dark:hover:bg-[#025E73]/10 [&_svg]:size-4",
        link: "text-[#025E73] underline-offset-4 hover:underline dark:text-[#64D2E5] [&_svg]:size-4",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 py-1 text-sm",
        lg: "h-11 px-6 py-2.5",
        icon: "h-10 w-10 p-2 [&_svg]:mx-0",
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