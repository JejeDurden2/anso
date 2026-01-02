import type { Task, CreateTaskInput, UpdateTaskInput } from '@anso/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import { dealKeys } from './deals';

// Extended Task type with deal relation
export interface TaskWithDeal extends Omit<Task, 'deal'> {
  deal: { id: string; title: string; value: number | null } | null;
}

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (workspaceId: string) => [...taskKeys.lists(), workspaceId] as const,
  pending: (workspaceId: string) => [...taskKeys.list(workspaceId), 'pending'] as const,
  byDeal: (workspaceId: string, dealId: string) =>
    [...taskKeys.list(workspaceId), 'deal', dealId] as const,
  detail: (workspaceId: string, id: string) =>
    [...taskKeys.all, 'detail', workspaceId, id] as const,
};

// API functions
async function fetchTasks(workspaceId: string): Promise<TaskWithDeal[]> {
  const response = await apiClient.get<TaskWithDeal[]>(`/workspaces/${workspaceId}/tasks`);
  return response.data;
}

async function fetchPendingTasks(workspaceId: string): Promise<TaskWithDeal[]> {
  const response = await apiClient.get<TaskWithDeal[]>(
    `/workspaces/${workspaceId}/tasks?completed=false`
  );
  return response.data;
}

async function fetchTasksByDeal(workspaceId: string, dealId: string): Promise<TaskWithDeal[]> {
  const response = await apiClient.get<TaskWithDeal[]>(
    `/workspaces/${workspaceId}/tasks?dealId=${dealId}`
  );
  return response.data;
}

async function createTask(workspaceId: string, input: CreateTaskInput): Promise<TaskWithDeal> {
  const response = await apiClient.post<TaskWithDeal>(`/workspaces/${workspaceId}/tasks`, input);
  return response.data;
}

async function updateTask(
  workspaceId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<TaskWithDeal> {
  const response = await apiClient.patch<TaskWithDeal>(
    `/workspaces/${workspaceId}/tasks/${taskId}`,
    input
  );
  return response.data;
}

async function deleteTask(workspaceId: string, taskId: string): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}/tasks/${taskId}`);
}

async function completeTask(workspaceId: string, taskId: string): Promise<TaskWithDeal> {
  const response = await apiClient.patch<TaskWithDeal>(
    `/workspaces/${workspaceId}/tasks/${taskId}`,
    { completed: true }
  );
  return response.data;
}

async function uncompleteTask(workspaceId: string, taskId: string): Promise<TaskWithDeal> {
  const response = await apiClient.patch<TaskWithDeal>(
    `/workspaces/${workspaceId}/tasks/${taskId}`,
    { completed: false }
  );
  return response.data;
}

// Hooks
export function useTasks(workspaceId: string) {
  return useQuery({
    queryKey: taskKeys.list(workspaceId),
    queryFn: () => fetchTasks(workspaceId),
    enabled: !!workspaceId,
  });
}

export function usePendingTasks(workspaceId: string) {
  return useQuery({
    queryKey: taskKeys.pending(workspaceId),
    queryFn: () => fetchPendingTasks(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useTasksByDeal(workspaceId: string, dealId: string) {
  return useQuery({
    queryKey: taskKeys.byDeal(workspaceId, dealId),
    queryFn: () => fetchTasksByDeal(workspaceId, dealId),
    enabled: !!workspaceId && !!dealId,
  });
}

export function useCreateTask(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(workspaceId, input),
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.list(workspaceId) });

      const previousTasks = queryClient.getQueryData<TaskWithDeal[]>(taskKeys.list(workspaceId));

      // Optimistic update
      queryClient.setQueryData<TaskWithDeal[]>(taskKeys.list(workspaceId), (old) => {
        const optimisticTask: TaskWithDeal = {
          id: `temp-${Date.now()}`,
          workspaceId,
          dealId: newTask.dealId,
          title: newTask.title,
          description: newTask.description,
          dueDate: newTask.dueDate,
          completed: false,
          source: newTask.source ?? 'manual',
          automationRuleId: newTask.automationRuleId,
          deal: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return [optimisticTask, ...(old ?? [])];
      });

      return { previousTasks };
    },
    onError: (_err, _newTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.list(workspaceId), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(workspaceId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.pending(workspaceId) });
    },
  });
}

export function useUpdateTask(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      updateTask(workspaceId, taskId, input),
    onMutate: async ({ taskId, input }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.list(workspaceId) });

      const previousTasks = queryClient.getQueryData<TaskWithDeal[]>(taskKeys.list(workspaceId));

      // Optimistic update
      queryClient.setQueryData<TaskWithDeal[]>(taskKeys.list(workspaceId), (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...input,
                updatedAt: new Date(),
              }
            : task
        );
      });

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.list(workspaceId), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(workspaceId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.pending(workspaceId) });
    },
  });
}

export function useToggleTask(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) =>
      completed ? completeTask(workspaceId, taskId) : uncompleteTask(workspaceId, taskId),
    onMutate: async ({ taskId, completed }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.list(workspaceId) });

      const previousTasks = queryClient.getQueryData<TaskWithDeal[]>(taskKeys.list(workspaceId));

      // Optimistic toggle
      queryClient.setQueryData<TaskWithDeal[]>(taskKeys.list(workspaceId), (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === taskId
            ? {
                ...task,
                completed,
                completedAt: completed ? new Date() : undefined,
                updatedAt: new Date(),
              }
            : task
        );
      });

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.list(workspaceId), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(workspaceId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.pending(workspaceId) });
    },
  });
}

export function useDeleteTask(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(workspaceId, taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.list(workspaceId) });

      const previousTasks = queryClient.getQueryData<TaskWithDeal[]>(taskKeys.list(workspaceId));

      // Optimistic delete
      queryClient.setQueryData<TaskWithDeal[]>(taskKeys.list(workspaceId), (old) => {
        if (!old) return old;
        return old.filter((task) => task.id !== taskId);
      });

      return { previousTasks };
    },
    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.list(workspaceId), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(workspaceId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.pending(workspaceId) });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
}
