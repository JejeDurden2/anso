import type { CreateTaskInput } from '@anso/types';
import { Button, Input } from '@anso/ui';
import { Plus, Calendar, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { cn } from '@/lib/utils';
import type { DealWithRelations } from '@/services/deals';

interface TaskQuickAddProps {
  deals: DealWithRelations[];
  onAdd: (input: CreateTaskInput) => void;
  defaultDealId?: string;
  isLoading?: boolean;
}

// Quick date options
const QUICK_DATES = [
  { label: "Aujourd'hui", days: 0 },
  { label: 'Demain', days: 1 },
  { label: 'Cette semaine', days: 3 },
  { label: 'Semaine prochaine', days: 7 },
];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function TaskQuickAdd({
  deals,
  onAdd,
  defaultDealId,
  isLoading,
}: TaskQuickAddProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [dealId, setDealId] = useState(defaultDealId ?? '');
  const [dueDays, setDueDays] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Reset dealId when defaultDealId changes
  useEffect(() => {
    if (defaultDealId) {
      setDealId(defaultDealId);
    }
  }, [defaultDealId]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (!title.trim() || !dealId) return;

    onAdd({
      dealId,
      title: title.trim(),
      dueDate: addDays(new Date(), dueDays),
      source: 'manual',
    });

    // Reset form
    setTitle('');
    setDueDays(1);
    if (!defaultDealId) {
      setDealId('');
    }
    setIsExpanded(false);
  };

  const handleCancel = (): void => {
    setTitle('');
    setDueDays(1);
    if (!defaultDealId) {
      setDealId('');
    }
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 p-3 text-sm text-slate-500 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
      >
        <Plus className="h-4 w-4" />
        Ajouter une tâche
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      {/* Title input */}
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Que devez-vous faire ?"
        className="border-0 px-0 text-sm font-medium shadow-none focus-visible:ring-0"
      />

      {/* Deal selector (if no default) */}
      {!defaultDealId && (
        <div className="mt-3">
          <select
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Sélectionner un deal</option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quick date buttons */}
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_DATES.map((option) => (
          <button
            key={option.days}
            type="button"
            onClick={() => setDueDays(option.days)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              dueDays === option.days
                ? 'bg-brand-100 text-brand-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            <Calendar className="h-3 w-3" />
            {option.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
        >
          <X className="mr-1 h-4 w-4" />
          Annuler
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!title.trim() || !dealId || isLoading}
          isLoading={isLoading}
        >
          <Plus className="mr-1 h-4 w-4" />
          Ajouter
        </Button>
      </div>
    </form>
  );
}
