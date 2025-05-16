import { cn } from "@/lib/utils"

/**
 * A skeleton component for showing loading states
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
      aria-label="Loading"
      aria-busy="true"
    />
  )
}

export { Skeleton }