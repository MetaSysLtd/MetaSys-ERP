import React from 'react';
import { Button } from '@/components/ui/button';
import { ListFilter, Kanban } from 'lucide-react';

interface ViewToggleProps {
  view: 'list' | 'kanban';
  onChange: (view: 'list' | 'kanban') => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-1">
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('list')}
        className={`flex items-center gap-1.5 px-3 ${
          view === 'list' ? 'text-white' : 'text-gray-700 hover:text-gray-900'
        }`}
      >
        <ListFilter className="h-4 w-4" />
        <span>List</span>
      </Button>
      <Button
        variant={view === 'kanban' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('kanban')}
        className={`flex items-center gap-1.5 px-3 ${
          view === 'kanban' ? 'text-white' : 'text-gray-700 hover:text-gray-900'
        }`}
      >
        <Kanban className="h-4 w-4" />
        <span>Kanban</span>
      </Button>
    </div>
  );
}