import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type ColumnOptions = {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

interface GridProps {
  children: ReactNode;
  cols: ColumnOptions;
  gap?: number;
  className?: string;
}

export function Grid({ children, cols, gap = 4, className }: GridProps) {
  // Generate grid columns classes
  const colClasses = [];
  
  if (cols.xs) colClasses.push(`grid-cols-${cols.xs}`);
  if (cols.sm) colClasses.push(`sm:grid-cols-${cols.sm}`);
  if (cols.md) colClasses.push(`md:grid-cols-${cols.md}`);
  if (cols.lg) colClasses.push(`lg:grid-cols-${cols.lg}`);
  if (cols.xl) colClasses.push(`xl:grid-cols-${cols.xl}`);
  
  // Default to 1 column if nothing is specified
  if (colClasses.length === 0) colClasses.push("grid-cols-1");
  
  return (
    <div 
      className={cn(
        "grid", 
        ...colClasses,
        `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  );
}