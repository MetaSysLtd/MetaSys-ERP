import * as React from "react"
import { cn } from "@/lib/utils"

interface SkipLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href: string
}

/**
 * Skip link component for keyboard navigation accessibility
 * 
 * This component allows keyboard users to skip navigation and go directly to main content
 * It's invisible until focused, making it only available for keyboard users who need it
 */
const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ className, href, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4",
          "bg-[#025E73] text-white dark:bg-[#025E73] dark:text-white",
          "px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F2A71B]",
          "dark:focus:ring-[#F2A71B] dark:focus:ring-offset-gray-900",
          className
        )}
        {...props}
      >
        {children || "Skip to content"}
      </a>
    )
  }
)

SkipLink.displayName = "SkipLink"

export { SkipLink }