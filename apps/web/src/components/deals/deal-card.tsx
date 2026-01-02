import { Card } from '@anso/ui';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, User } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { DealWithRelations } from '@/services/deals';

interface DealCardProps {
  deal: DealWithRelations;
  onClick: () => void;
  isDragging?: boolean;
}

export function DealCard({ deal, onClick, isDragging }: DealCardProps): JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: deal.id,
    data: {
      type: 'deal',
      deal,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'group cursor-pointer bg-white p-3 shadow-sm ring-1 ring-slate-200/50',
        'transition-all duration-200',
        // Hover states
        'hover:shadow-md hover:ring-slate-300 hover:-translate-y-0.5',
        // Active state
        'active:shadow-sm active:translate-y-0'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 cursor-grab rounded p-0.5 text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-500 group-hover:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-slate-900 group-hover:text-slate-800">
            {deal.title}
          </h3>
          {deal.value !== null && deal.value > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(deal.value)}
            </p>
          )}
          {deal.contact && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-slate-500">
              <User className="h-3 w-3" />
              <span className="truncate">{deal.contact.name}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// Overlay version for drag preview
export function DealCardOverlay({ deal }: { deal: DealWithRelations }): JSX.Element {
  return (
    <Card className="w-64 rotate-2 cursor-grabbing bg-white p-3 shadow-2xl ring-2 ring-brand-500/50 sm:w-72">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 rounded p-0.5 text-brand-500">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-slate-900">{deal.title}</h3>
          {deal.value !== null && deal.value > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(deal.value)}
            </p>
          )}
          {deal.contact && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <User className="h-3 w-3" />
              <span className="truncate">{deal.contact.name}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
