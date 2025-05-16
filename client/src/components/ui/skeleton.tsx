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

/**
 * KPI Card skeleton for dashboard metrics
 */
export function KPICardSkeleton() {
  return (
    <div className="p-6 rounded-lg border border-border bg-card shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-12 w-24 mb-3" />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  )
}

/**
 * App layout skeleton for initial loading state
 */
export function AppLayoutSkeleton() {
  return (
    <div className="w-full h-screen flex">
      {/* Sidebar skeleton */}
      <div className="w-64 h-full bg-muted/20 border-r border-border hidden lg:block">
        <div className="p-4">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="space-y-2">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 p-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

/**
 * Dashboard skeleton for initial loading state of dashboard components
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
      
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-6 rounded-lg border border-border bg-card h-[300px] flex flex-col">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-[240px] w-full" />
        </div>
        <div className="p-6 rounded-lg border border-border bg-card h-[300px] flex flex-col">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-[240px] w-full" />
        </div>
      </div>
      
      {/* Table row */}
      <div className="p-6 rounded-lg border border-border bg-card">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export { Skeleton }