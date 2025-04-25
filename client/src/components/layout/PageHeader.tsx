import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionButton?: ReactNode;
}

const PageHeader = ({ title, description, actionButton }: PageHeaderProps) => {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 md:text-lg">{description}</p>
        )}
      </div>
      {actionButton && (
        <div className="flex-shrink-0">
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default PageHeader;