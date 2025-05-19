import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

interface ViewButtonProps extends Omit<ButtonProps, 'variant'> {
  label?: string;
  iconOnly?: boolean;
  to?: string;
}

export function ViewButton({ 
  label = 'View', 
  iconOnly = false, 
  className, 
  children,
  to,
  ...props 
}: ViewButtonProps) {
  
  const content = (
    <>
      <Eye className="h-4 w-4" />
      {!iconOnly && <span>{label || children}</span>}
    </>
  );

  if (to) {
    return (
      <Button
        variant="view"
        className={cn("", className)}
        asChild
        {...props}
      >
        <Link to={to}>
          {content}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant="view"
      className={cn("", className)}
      {...props}
    >
      {content}
    </Button>
  );
}