import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  /**
   * The title text for the empty state
   */
  title: string;
  
  /**
   * The description text that provides more detail
   */
  description?: string;
  
  /**
   * Icon to display at the top of the empty state
   */
  icon?: React.ReactNode;
  
  /**
   * Optional action element (e.g., a button) to display below description
   */
  action?: React.ReactNode;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Additional CSS classes for the container
   */
  containerClassName?: string;
}

/**
 * EmptyState - A consistent UI component for displaying empty states, no data, or errors
 * 
 * This component provides a standardized way to inform users when:
 * - There is no data to display
 * - An error has occurred
 * - A search returned no results
 * - Content is loading
 * 
 * It supports an icon, title, description, and a custom action.
 * 
 * @example
 * ```tsx
 * <EmptyState 
 *   icon={<FileQuestion className="h-16 w-16 text-muted-foreground" />}
 *   title="No invoices found"
 *   description="We couldn't find any invoices matching your criteria."
 *   action={<Button>Create New Invoice</Button>}
 * />
 * ```
 */
export function EmptyState({ 
  title, 
  description, 
  icon, 
  action,
  className,
  containerClassName,
}: EmptyStateProps) {
  return (
    <div className={cn("w-full py-6", containerClassName)}>
      <Card className={cn(
        "flex flex-col items-center justify-center text-center py-10 px-6",
        "border-dashed bg-muted/20 shadow-sm",
        className
      )}>
        <CardContent className="flex flex-col items-center space-y-4 pt-6">
          <div className="text-muted-foreground mb-2">
            {icon || <FileQuestion className="h-14 w-14 text-muted-foreground/60" />}
          </div>
          
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          
          {description && (
            <p className="text-muted-foreground max-w-md">
              {description}
            </p>
          )}
          
          {action && (
            <div className="mt-6">
              {action}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}