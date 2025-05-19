import React from 'react';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid } from 'lucide-react';

interface ViewToggleProps {
  view: 'list' | 'kanban';
  onChange: (view: 'list' | 'kanban') => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex border rounded-md">
      <Button
        variant={view === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('list')}
        className={`rounded-r-none border-r-0 ${view === 'list' ? 'border-none' : ''}`}
      >
        <List className="h-4 w-4" />
        <span>List</span>
      </Button>
      <Button
        variant={view === 'kanban' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('kanban')}
        className={`rounded-l-none ${view === 'kanban' ? 'border-none' : ''}`}
      >
        <LayoutGrid className="h-4 w-4" />
        <span>Kanban</span>
      </Button>
    </div>
  );
}