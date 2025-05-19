import React from 'react';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  view: 'list' | 'kanban';
  onChange: (view: 'list' | 'kanban') => void;
  className?: string;
}

export function ViewToggle({ view, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn("inline-flex border rounded-md", className)}>
      <Button
        variant={view === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('list')}
        className="rounded-r-none border-r-0"
      >
        <List className="h-4 w-4" />
        <span>List</span>
      </Button>
      <Button
        variant={view === 'kanban' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('kanban')}
        className="rounded-l-none"
      >
        <LayoutGrid className="h-4 w-4" />
        <span>Kanban</span>
      </Button>
    </div>
  );
}