import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewButtonProps extends Omit<ButtonProps, 'variant'> {
  label?: string;
  iconOnly?: boolean;
}

export function ViewButton({ 
  label = 'View', 
  iconOnly = false, 
  className, 
  children,
  ...props 
}: ViewButtonProps) {
  return (
    <Button
      variant="view"
      className={cn("", className)}
      {...props}
    >
      <Eye className="h-4 w-4" />
      {!iconOnly && (label || children)}
    </Button>
  );
}