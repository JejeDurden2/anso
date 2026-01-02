import { Card } from '@anso/ui';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, User } from 'lucide-react';


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
      className="group cursor-pointer bg-white p-3 shadow-sm transition-all hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 cursor-grab rounded p-0.5 text-slate-300 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-500 group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-slate-900">{deal.title}</h3>
          {deal.value !== null && (
            <p className="mt-1 text-sm font-semibold text-brand-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(deal.value)}
            </p>
          )}
          {deal.contact && (
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
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
    <Card className="w-64 rotate-3 cursor-grabbing bg-white p-3 shadow-xl ring-2 ring-brand-500">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 rounded p-0.5 text-slate-400">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-slate-900">{deal.title}</h3>
          {deal.value !== null && (
            <p className="mt-1 text-sm font-semibold text-brand-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(deal.value)}
            </p>
          )}
          {deal.contact && (
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
              <User className="h-3 w-3" />
              <span className="truncate">{deal.contact.name}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
