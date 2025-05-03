import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export function PageHeader({ 
  title, 
  description, 
  actions, 
  icon,
  breadcrumbs
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-6 mb-6"
    >
      <div className="space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center text-sm text-muted-foreground mb-1">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <span className="mx-2 text-muted-foreground">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {icon && <div className="text-[#025E73]">{icon}</div>}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        
        {description && (
          <p className="text-muted-foreground max-w-3xl">{description}</p>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          {actions}
        </div>
      )}
    </motion.div>
  );
}