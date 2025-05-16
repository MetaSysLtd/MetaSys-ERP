import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function KPICardSkeleton() {
  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white dark:bg-gray-800">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="mt-3">
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      
      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
      
      {/* Chart Section */}
      <Skeleton className="h-64 w-full" />
      
      {/* Grid Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

function SidebarSkeleton() {
  return (
    <div className="h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 w-64">
      {/* Logo area */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Skeleton className="h-8 w-32" />
      </div>
      
      {/* Nav items */}
      <div className="p-4 space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <div className="pl-3 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppLayoutSkeleton() {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <SidebarSkeleton />
      </div>
      
      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4">
          <Skeleton className="h-8 w-40" />
          <div className="flex space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        
        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="px-4 py-6">
            <DashboardSkeleton />
          </div>
        </main>
      </div>
    </div>
  )
}

export { Skeleton, KPICardSkeleton, DashboardSkeleton, SidebarSkeleton, AppLayoutSkeleton }
