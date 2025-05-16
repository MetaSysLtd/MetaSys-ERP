import * as React from "react"
import { AlertCircle, RefreshCcw, ArrowLeft } from "lucide-react"
import { useNavigate } from "wouter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ErrorCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The title of the error card
   */
  title?: string
  
  /**
   * The error message to display
   */
  message: string
  
  /**
   * The error details (shown as raw data or expandable)
   */
  details?: string
  
  /**
   * Whether to show a refresh button
   */
  showRefresh?: boolean
  
  /**
   * Whether to show a back button
   */
  showBack?: boolean
  
  /**
   * The function to call when the refresh button is clicked
   */
  onRefresh?: () => void
  
  /**
   * The severity of the error
   */
  severity?: "low" | "medium" | "high" | "critical"
  
  /**
   * Whether the error is dismissible
   */
  dismissible?: boolean
  
  /**
   * The function to call when the error is dismissed
   */
  onDismiss?: () => void
  
  /**
   * A custom action to show in the footer
   */
  action?: React.ReactNode
}

/**
 * An enhanced error card with consistent styling and behavior
 */
export function ErrorCard({
  title = "Error",
  message,
  details,
  showRefresh = true,
  showBack = false,
  onRefresh,
  severity = "medium",
  dismissible = false,
  onDismiss,
  action,
  className,
  ...props
}: ErrorCardProps) {
  const navigate = useNavigate()[1]
  const [isExpanded, setIsExpanded] = React.useState(false)
  
  // Map severity to appropriate styling
  const severityStyles = {
    low: "bg-amber-50 border-amber-200",
    medium: "bg-red-50 border-red-200",
    high: "bg-red-100 border-red-300",
    critical: "bg-red-200 border-red-400"
  }
  
  // Default refresh handler reloads the page
  const handleRefresh = React.useCallback(() => {
    if (onRefresh) {
      onRefresh()
    } else {
      window.location.reload()
    }
  }, [onRefresh])
  
  // Go back handler
  const handleBack = React.useCallback(() => {
    navigate(-1)
  }, [navigate])
  
  return (
    <Card 
      className={cn(
        "border-2", 
        severityStyles[severity],
        className
      )}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700">{message}</p>
        
        {details && (
          <div className="mt-4">
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Hide details" : "Show details"}
            </button>
            
            {isExpanded && (
              <pre className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground overflow-auto max-h-[200px]">
                {details}
              </pre>
            )}
          </div>
        )}
      </CardContent>
      
      {(showRefresh || showBack || dismissible || action) && (
        <CardFooter className="flex gap-2 justify-start pt-0">
          {showRefresh && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleRefresh}
              className="gap-1"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          )}
          
          {showBack && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={handleBack}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          )}
          
          {action && action}
          
          {dismissible && onDismiss && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={onDismiss}
              className="ml-auto"
            >
              Dismiss
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}