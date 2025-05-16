import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Table component props
 */
interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /**
   * Adds zebra striping to table rows
   */
  striped?: boolean;
  
  /**
   * Adds hoverable effect to table rows
   */
  hoverable?: boolean;
  
  /**
   * Makes the table more compact with smaller padding
   */
  dense?: boolean;
  
  /**
   * Makes the table full width
   */
  fullWidth?: boolean;
  
  /**
   * Adds borders to cells
   */
  bordered?: boolean;
  
  /**
   * Adds a loading state to the table
   */
  loading?: boolean;
  
  /**
   * Aria label for the table (for better screen reader support)
   */
  ariaLabel?: string;
  
  /**
   * Description of the table for screen readers
   */
  ariaDescription?: string;
}

const tableStyles = cva("text-sm caption-bottom rounded-md overflow-hidden", {
  variants: {
    fullWidth: {
      true: "w-full min-w-[600px]",
      false: "w-auto"
    },
    bordered: {
      true: "border border-border dark:border-gray-700",
      false: ""
    },
    dense: {
      true: "[&_th]:py-2 [&_th]:px-3 [&_td]:py-2 [&_td]:px-3",
      false: ""
    }
  },
  defaultVariants: {
    fullWidth: true,
    bordered: false,
    dense: false
  }
})

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ 
    className, 
    striped, 
    hoverable, 
    dense, 
    fullWidth, 
    bordered, 
    loading,
    ariaLabel,
    ariaDescription,
    children,
    ...props 
  }, ref) => {
    const tableId = React.useId();
    const descriptionId = ariaDescription ? `${tableId}-description` : undefined;
    
    return (
      <div className="relative w-full overflow-x-auto rounded-md">
        {/* Accessibility description for screen readers */}
        {ariaDescription && (
          <div id={descriptionId} className="sr-only">
            {ariaDescription}
          </div>
        )}
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10" 
               aria-live="polite"
               aria-label="Loading table data">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
        
        <table
          ref={ref}
          className={cn(
            tableStyles({ fullWidth, bordered, dense }),
            striped && "[&_tbody_tr:nth-of-type(odd)]:bg-muted/40 dark:[&_tbody_tr:nth-of-type(odd)]:bg-gray-800/40",
            hoverable && "[&_tbody_tr]:hover:bg-muted/60 dark:[&_tbody_tr]:hover:bg-gray-800/60",
            loading && "opacity-60",
            className
          )}
          aria-label={ariaLabel}
          aria-describedby={descriptionId}
          role="table"
          {...props}
        >
          {children}
        </table>
      </div>
    )
  }
)
Table.displayName = "Table"

/**
 * Header section of the table
 */
interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /**
   * Makes the header sticky to the top when scrolling
   */
  sticky?: boolean;
}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, sticky, ...props }, ref) => (
    <thead 
      ref={ref} 
      className={cn(
        "bg-muted/30 dark:bg-gray-800/30 text-left [&_tr]:border-b",
        sticky && "sticky top-0 z-10",
        className
      )} 
      {...props} 
    />
  )
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 dark:bg-gray-800/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

/**
 * Table row component
 */
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /**
   * Whether the row is currently selected
   */
  selected?: boolean;
  
  /**
   * Whether the row is clickable
   */
  clickable?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, clickable, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors",
        selected && "bg-primary/10 dark:bg-primary/20",
        clickable && "cursor-pointer",
        className
      )}
      data-state={selected ? "selected" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-selected={selected}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

/**
 * Table header cell
 */
interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /**
   * Whether the column is sortable
   */
  sortable?: boolean;
  
  /**
   * Current sort direction: 'asc', 'desc' or undefined
   */
  sortDirection?: 'asc' | 'desc' | undefined;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable, sortDirection, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-10 px-4 py-3 text-left align-middle font-medium text-muted-foreground",
        "[&:has([role=checkbox])]:pr-0",
        sortable && "cursor-pointer select-none",
        className
      )}
      aria-sort={
        sortDirection === 'asc'
          ? 'ascending'
          : sortDirection === 'desc'
            ? 'descending'
            : sortable
              ? 'none'
              : undefined
      }
      {...props}
    >
      {sortable ? (
        <div className="flex items-center gap-1">
          {children}
          {sortDirection && (
            <span className="ml-1" aria-hidden="true">
              {sortDirection === 'asc' ? '▲' : '▼'}
            </span>
          )}
        </div>
      ) : (
        children
      )}
    </th>
  )
)
TableHead.displayName = "TableHead"

/**
 * Table cell props
 */
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * Truncate text that overflows
   */
  truncate?: boolean;
  
  /**
   * Align cell content
   */
  align?: 'left' | 'center' | 'right';
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, truncate, align, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        truncate && "truncate max-w-[200px]",
        align === 'center' && "text-center",
        align === 'right' && "text-right",
        className
      )}
      {...props}
    />
  )
)
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

export type {
  TableProps,
  TableHeaderProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
}