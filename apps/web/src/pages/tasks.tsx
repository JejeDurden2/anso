import type { CreateTaskInput } from '@anso/types';
import { Card } from '@anso/ui';
import { CheckSquare, Loader2 } from 'lucide-react';

import { TaskList, TaskQuickAdd } from '@/components/tasks';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import { useDeals } from '@/services/deals';
import {
  useTasks,
  useCreateTask,
  useToggleTask,
  useDeleteTask,
} from '@/services/tasks';

export function TasksPage(): JSX.Element {
  const { workspaceId, isLoading: isWorkspaceLoading } = useCurrentWorkspace();

  const { data: tasks = [], isLoading: isTasksLoading } = useTasks(workspaceId);
  const { data: deals = [], isLoading: isDealsLoading } = useDeals(workspaceId);
  const createTask = useCreateTask(workspaceId);
  const toggleTask = useToggleTask(workspaceId);
  const deleteTask = useDeleteTask(workspaceId);

  const isLoading = isWorkspaceLoading || isTasksLoading;

  const handleAddTask = (input: CreateTaskInput): void => {
    createTask.mutate(input);
  };

  const handleToggle = (taskId: string, completed: boolean): void => {
    toggleTask.mutate({ taskId, completed });
  };

  const handleDelete = (taskId: string): void => {
    deleteTask.mutate(taskId);
  };

  // Separate pending and completed tasks
  const pendingTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const completedTasks = tasks
    .filter((t) => t.completed)
    .sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA; // Most recently completed first
    });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Tâches</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gérez vos tâches de suivi pour vos deals
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main tasks section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending tasks */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <CheckSquare className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">À faire</h2>
                <p className="text-xs text-slate-500">
                  {pendingTasks.length === 0
                    ? 'Aucune tâche en attente'
                    : `${pendingTasks.length} tâche${pendingTasks.length > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            <TaskList
              tasks={pendingTasks}
              onToggle={handleToggle}
              onDelete={handleDelete}
              emptyMessage="Aucune tâche en attente. Ajoutez-en une ci-dessous !"
            />
          </Card>

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                  <CheckSquare className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Terminées</h2>
                  <p className="text-xs text-slate-500">
                    {completedTasks.length} tâche{completedTasks.length > 1 ? 's' : ''} terminée{completedTasks.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <TaskList
                tasks={completedTasks}
                onToggle={handleToggle}
                onDelete={handleDelete}
                emptyMessage=""
              />
            </Card>
          )}
        </div>

        {/* Sidebar - Quick add */}
        <div className="space-y-6">
          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Ajouter une tâche</h3>
            {deals.length > 0 ? (
              <TaskQuickAdd
                deals={deals}
                onAdd={handleAddTask}
                isLoading={createTask.isPending || isDealsLoading}
                error={createTask.error}
              />
            ) : (
              <p className="text-sm text-slate-500">
                Créez d&apos;abord un deal pour pouvoir ajouter des tâches.
              </p>
            )}
          </Card>

          {/* Stats */}
          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Résumé</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">En attente</span>
                <span className="text-sm font-medium text-slate-900">{pendingTasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Terminées</span>
                <span className="text-sm font-medium text-slate-900">{completedTasks.length}</span>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Total</span>
                  <span className="text-sm font-bold text-slate-900">{tasks.length}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
