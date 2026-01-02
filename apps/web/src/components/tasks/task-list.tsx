import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Zap,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';
import type { TaskWithDeal } from '@/services/tasks';

interface TaskListProps {
  tasks: TaskWithDeal[];
  isLoading?: boolean;
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete?: (taskId: string) => void;
  showDealLink?: boolean;
  emptyMessage?: string;
  maxItems?: number;
}

// Format due date with urgency indication
function formatDueDate(date: Date): { text: string; isOverdue: boolean; isToday: boolean } {
  const now = new Date();
  const dueDate = new Date(date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffDays = Math.floor(
    (dueDateDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      text: absDays === 1 ? 'Hier' : `En retard de ${absDays} jours`,
      isOverdue: true,
      isToday: false,
    };
  }

  if (diffDays === 0) {
    return { text: "Aujourd'hui", isOverdue: false, isToday: true };
  }

  if (diffDays === 1) {
    return { text: 'Demain', isOverdue: false, isToday: false };
  }

  if (diffDays < 7) {
    return { text: `Dans ${diffDays} jours`, isOverdue: false, isToday: false };
  }

  return {
    text: dueDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    }),
    isOverdue: false,
    isToday: false,
  };
}

export function TaskList({
  tasks,
  isLoading,
  onToggle,
  onDelete,
  showDealLink = true,
  emptyMessage = 'Aucune tâche en attente',
  maxItems,
}: TaskListProps): JSX.Element {
  const displayTasks = maxItems ? tasks.slice(0, maxItems) : tasks;
  const hasMore = maxItems && tasks.length > maxItems;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex animate-pulse items-start gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/50"
          >
            <div className="h-5 w-5 rounded bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-600">{emptyMessage}</p>
        <p className="mt-1 text-xs text-slate-400">Vous êtes à jour !</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayTasks.map((task) => {
        const dueInfo = formatDueDate(task.dueDate);

        return (
          <div
            key={task.id}
            className={cn(
              'group flex items-start gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 transition-all',
              task.completed
                ? 'ring-slate-100 opacity-60'
                : dueInfo.isOverdue
                  ? 'ring-red-200 bg-red-50/50'
                  : dueInfo.isToday
                    ? 'ring-amber-200 bg-amber-50/50'
                    : 'ring-slate-200/50 hover:ring-slate-300 hover:shadow-md'
            )}
          >
            {/* Checkbox */}
            <button
              onClick={() => onToggle(task.id, !task.completed)}
              className={cn(
                'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-colors',
                task.completed
                  ? 'text-emerald-500'
                  : 'text-slate-300 hover:text-brand-500'
              )}
            >
              {task.completed ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p
                  className={cn(
                    'text-sm font-medium',
                    task.completed
                      ? 'text-slate-400 line-through'
                      : 'text-slate-900'
                  )}
                >
                  {task.title}
                </p>

                {/* Automation badge */}
                {task.source === 'automation' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    <Zap className="h-3 w-3" />
                    Auto
                  </span>
                )}
              </div>

              {/* Deal link and due date */}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {showDealLink && task.deal && (
                  <Link
                    to={`/app/deals?deal=${task.dealId}`}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-600"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {task.deal.title}
                  </Link>
                )}

                {!task.completed && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1',
                      dueInfo.isOverdue
                        ? 'font-medium text-red-600'
                        : dueInfo.isToday
                          ? 'font-medium text-amber-600'
                          : 'text-slate-500'
                    )}
                  >
                    {dueInfo.isOverdue ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {dueInfo.text}
                  </span>
                )}
              </div>

              {/* Description */}
              {task.description && !task.completed && (
                <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>

            {/* Delete button */}
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="flex-shrink-0 rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}

      {hasMore && (
        <p className="pt-2 text-center text-xs text-slate-500">
          +{tasks.length - maxItems!} autres tâches
        </p>
      )}
    </div>
  );
}
