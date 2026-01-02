import type { CreateTaskInput } from '@anso/types';
import { Button } from '@anso/ui';
import { Plus, Calendar, ChevronDown, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { cn } from '@/lib/utils';
import type { DealWithRelations } from '@/services/deals';

interface TaskQuickAddProps {
  deals: DealWithRelations[];
  onAdd: (input: CreateTaskInput) => void;
  defaultDealId?: string;
  isLoading?: boolean;
  error?: Error | null;
}

// Quick date options
const QUICK_DATES = [
  { label: "Aujourd'hui", days: 0 },
  { label: 'Demain', days: 1 },
  { label: 'Dans 3 jours', days: 3 },
  { label: 'Dans 1 semaine', days: 7 },
] as const;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDueDateLabel(days: number): string {
  return QUICK_DATES.find((d) => d.days === days)?.label ?? `Dans ${days} jours`;
}

export function TaskQuickAdd({
  deals,
  onAdd,
  defaultDealId,
  isLoading,
  error,
}: TaskQuickAddProps): JSX.Element {
  const [title, setTitle] = useState('');
  const [dealId, setDealId] = useState(defaultDealId ?? '');
  const [dueDays, setDueDays] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDealPicker, setShowDealPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const dealPickerRef = useRef<HTMLDivElement>(null);

  // Reset dealId when defaultDealId changes
  useEffect(() => {
    if (defaultDealId) {
      setDealId(defaultDealId);
    }
  }, [defaultDealId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (dealPickerRef.current && !dealPickerRef.current.contains(event.target as Node)) {
        setShowDealPicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const selectedDeal = deals.find((d) => d.id === dealId);
  const canSubmit = title.trim() && dealId && !isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Main input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nouvelle tâche..."
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-24 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!canSubmit}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Options row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Deal selector */}
        {!defaultDealId && (
          <div className="relative" ref={dealPickerRef}>
            <button
              type="button"
              onClick={() => {
                setShowDealPicker(!showDealPicker);
                setShowDatePicker(false);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                dealId
                  ? 'border-brand-200 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className="max-w-[120px] truncate">
                {selectedDeal?.title ?? 'Choisir un deal'}
              </span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showDealPicker && (
              <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-56 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {deals.map((deal) => (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => {
                      setDealId(deal.id);
                      setShowDealPicker(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm transition-colors',
                      deal.id === dealId
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <span className="block truncate">{deal.title}</span>
                    {deal.contact && (
                      <span className="block truncate text-xs text-slate-500">
                        {deal.contact.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Date selector */}
        <div className="relative" ref={datePickerRef}>
          <button
            type="button"
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setShowDealPicker(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Calendar className="h-3 w-3" />
            {getDueDateLabel(dueDays)}
            <ChevronDown className="h-3 w-3" />
          </button>

          {showDatePicker && (
            <div className="absolute left-0 top-full z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {QUICK_DATES.map((option) => (
                <button
                  key={option.days}
                  type="button"
                  onClick={() => {
                    setDueDays(option.days);
                    setShowDatePicker(false);
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm transition-colors',
                    dueDays === option.days
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Validation hint */}
      {title.trim() && !dealId && !defaultDealId && (
        <p className="text-xs text-amber-600">
          Sélectionnez un deal pour ajouter la tâche
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600">
          Erreur lors de la création : {error.message}
        </p>
      )}
    </form>
  );
}
