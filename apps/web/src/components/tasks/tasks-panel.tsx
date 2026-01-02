import type { CreateTaskInput } from '@anso/types';
import { Card } from '@anso/ui';
import { CheckSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useCurrentWorkspace } from '@/hooks/use-workspace';
import type { DealWithRelations } from '@/services/deals';
import {
  usePendingTasks,
  useCreateTask,
  useToggleTask,
  useDeleteTask,
} from '@/services/tasks';

import { TaskList } from './task-list';
import { TaskQuickAdd } from './task-quick-add';

interface TasksPanelProps {
  deals: DealWithRelations[];
  isLoading?: boolean;
}

export function TasksPanel({ deals, isLoading: isDealsLoading }: TasksPanelProps): JSX.Element {
  const { workspaceId } = useCurrentWorkspace();

  const { data: tasks = [], isLoading: isTasksLoading } = usePendingTasks(workspaceId);
  const createTask = useCreateTask(workspaceId);
  const toggleTask = useToggleTask(workspaceId);
  const deleteTask = useDeleteTask(workspaceId);

  const isLoading = isDealsLoading || isTasksLoading;

  const handleAddTask = (input: CreateTaskInput): void => {
    createTask.mutate(input);
  };

  const handleToggle = (taskId: string, completed: boolean): void => {
    toggleTask.mutate({ taskId, completed });
  };

  const handleDelete = (taskId: string): void => {
    deleteTask.mutate(taskId);
  };

  // Sort tasks by due date (most urgent first)
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    return dateA - dateB;
  });

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-5 w-5 rounded bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
            <CheckSquare className="h-4 w-4 text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Tâches à faire</h3>
            <p className="text-xs text-slate-500">
              {tasks.length === 0
                ? 'Aucune tâche en attente'
                : `${tasks.length} tâche${tasks.length > 1 ? 's' : ''} en attente`}
            </p>
          </div>
        </div>

        <Link
          to="/app/tasks"
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          Voir tout
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-4 space-y-4">
        <TaskList
          tasks={sortedTasks}
          onToggle={handleToggle}
          onDelete={handleDelete}
          maxItems={5}
          emptyMessage="Aucune tâche en attente"
        />

        {deals.length > 0 && (
          <TaskQuickAdd
            deals={deals}
            onAdd={handleAddTask}
            isLoading={createTask.isPending}
            error={createTask.error}
          />
        )}
      </div>
    </Card>
  );
}
