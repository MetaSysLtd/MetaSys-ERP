
import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';

interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  backTo?: string;
  backLabel?: string;
  status?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function PageLayout({
  title,
  description,
  children,
  actionLabel,
  actionIcon = <Plus className="h-4 w-4 mr-2" />,
  onAction,
  backTo,
  backLabel,
  status,
  rightContent
}: PageLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      <Helmet>
        <title>{title} | MetaSys ERP</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between py-4 px-4 md:px-6 border-b">
        <div className="flex flex-col mb-4 md:mb-0">
          {backTo && (
            <Link href={backTo}>
              <Button variant="link" className="px-0 mb-1 text-muted-foreground hover:text-primary">
                <ChevronLeft className="h-4 w-4 mr-1" />
                {backLabel || 'Back'}
              </Button>
            </Link>
          )}
          
          <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {status && <div className="ml-4">{status}</div>}
          </div>
          
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {rightContent}
          
          {actionLabel && onAction && (
            <Button onClick={onAction} className="ml-auto">
              {actionIcon}
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
