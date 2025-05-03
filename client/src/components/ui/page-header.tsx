import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MotionWrapper } from './motion-wrapper';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  className,
  actions,
  children
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <MotionWrapper animation="slideRight" delay={0.1}>
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 rounded-md bg-white/80 shadow-sm border border-[#025E73]/20">
                {icon}
              </div>
            )}
            
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {title}
              </h1>
              
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </MotionWrapper>
        
        {actions && (
          <MotionWrapper animation="slideLeft" delay={0.2}>
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          </MotionWrapper>
        )}
      </div>
      
      {children && (
        <MotionWrapper animation="slideUp" delay={0.3} className="mt-4">
          {children}
        </MotionWrapper>
      )}
    </div>
  );
}