import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';

import { Button, Input } from '@anso/ui';
import type { Stage } from '@anso/types';

import { DealCard } from './deal-card';
import type { DealWithRelations } from '@/services/deals';

interface KanbanColumnProps {
  stage: Stage;
  deals: DealWithRelations[];
  onDealClick: (deal: DealWithRelations) => void;
  onQuickAdd: (title: string, stageId: string) => void;
  activeId: string | null;
}

export function KanbanColumn({
  stage,
  deals,
  onDealClick,
  onQuickAdd,
  activeId,
}: KanbanColumnProps): JSX.Element {
  const [isAdding, setIsAdding] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: {
      type: 'stage',
      stage,
    },
  });

  const handleQuickAdd = (): void => {
    if (quickAddTitle.trim()) {
      onQuickAdd(quickAddTitle.trim(), stage.id);
      setQuickAddTitle('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQuickAdd();
    } else if (e.key === 'Escape') {
      setQuickAddTitle('');
      setIsAdding(false);
    }
  };

  // Calculate total value of deals in this column
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-lg bg-slate-100/50">
      {/* Column header */}
      <div className="flex items-center gap-2 rounded-t-lg border-b border-slate-200 bg-white px-4 py-3">
        <div
          className="h-3 w-3 rounded-full ring-2 ring-white"
          style={{ backgroundColor: stage.color }}
        />
        <h2 className="font-semibold text-slate-900">{stage.name}</h2>
        <span className="ml-auto flex items-center gap-2 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
            {deals.length}
          </span>
        </span>
      </div>

      {/* Total value */}
      {totalValue > 0 && (
        <div className="border-b border-slate-200 bg-white px-4 py-2 text-sm">
          <span className="font-semibold text-brand-600">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(totalValue)}
          </span>
        </div>
      )}

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-1 flex-col gap-2 p-2 transition-colors ${
          isOver ? 'bg-brand-50' : ''
        }`}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onClick={() => onDealClick(deal)}
              isDragging={activeId === deal.id}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {deals.length === 0 && !isAdding && (
          <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
            Déposez un deal ici
          </div>
        )}

        {/* Quick add form */}
        {isAdding ? (
          <div className="rounded-lg bg-white p-2 shadow-sm">
            <Input
              autoFocus
              placeholder="Nom de l'opportunité..."
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="mb-2"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleQuickAdd} disabled={!quickAddTitle.trim()}>
                Ajouter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setQuickAddTitle('');
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        )}
      </div>
    </div>
  );
}
