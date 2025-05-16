import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#025E73] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-[#025E73] text-white hover:bg-[#011F26] active:bg-[#412754] text-sm sm:text-base px-2 sm:px-4 hover:-translate-y-1 hover:shadow-md active:translate-y-0 active:shadow-inner",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/100 text-sm sm:text-base px-2 sm:px-4 hover:-translate-y-1 hover:shadow-md active:translate-y-0 active:shadow-inner",
        outline:
          "border border-[#025E73] bg-background text-[#025E73] hover:bg-[#025E73]/5 hover:border-[#011F26] active:bg-[#025E73]/10 active:border-[#025E73] text-sm sm:text-base px-2 sm:px-4 hover:-translate-y-1 hover:shadow-md active:translate-y-0 active:shadow-inner",
        secondary:
          "bg-[#F2A71B] text-white hover:bg-[#E09616] active:bg-[#D18613] text-sm sm:text-base px-2 sm:px-4 hover:-translate-y-1 hover:shadow-md active:translate-y-0 active:shadow-inner",
        ghost: "hover:bg-[#025E73]/10 hover:text-[#025E73] active:bg-[#025E73]/20 text-sm sm:text-base px-2 sm:px-4",
        link: "text-[#025E73] underline-offset-4 hover:underline hover:text-[#011F26] active:text-[#412754] text-sm sm:text-base px-2 sm:px-4",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }