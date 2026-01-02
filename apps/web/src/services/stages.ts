import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { Stage, CreateStageInput, UpdateStageInput, ReorderStagesInput } from '@anso/types';

import { apiClient } from '@/lib/api-client';

// Query keys
export const stageKeys = {
  all: ['stages'] as const,
  list: (workspaceId: string) => [...stageKeys.all, 'list', workspaceId] as const,
};

// API functions
async function fetchStages(workspaceId: string): Promise<Stage[]> {
  const response = await apiClient.get<Stage[]>(`/workspaces/${workspaceId}/stages`);
  return response.data;
}

async function createStage(workspaceId: string, input: CreateStageInput): Promise<Stage> {
  const response = await apiClient.post<Stage>(`/workspaces/${workspaceId}/stages`, input);
  return response.data;
}

async function updateStage(
  workspaceId: string,
  stageId: string,
  input: UpdateStageInput
): Promise<Stage> {
  const response = await apiClient.patch<Stage>(
    `/workspaces/${workspaceId}/stages/${stageId}`,
    input
  );
  return response.data;
}

async function reorderStages(
  workspaceId: string,
  input: ReorderStagesInput
): Promise<Stage[]> {
  const response = await apiClient.patch<Stage[]>(
    `/workspaces/${workspaceId}/stages/reorder`,
    input
  );
  return response.data;
}

async function deleteStage(workspaceId: string, stageId: string): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}/stages/${stageId}`);
}

// Hooks
export function useStages(workspaceId: string) {
  return useQuery({
    queryKey: stageKeys.list(workspaceId),
    queryFn: () => fetchStages(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateStage(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStageInput) => createStage(workspaceId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stageKeys.list(workspaceId) });
    },
  });
}

export function useUpdateStage(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stageId, input }: { stageId: string; input: UpdateStageInput }) =>
      updateStage(workspaceId, stageId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stageKeys.list(workspaceId) });
    },
  });
}

export function useReorderStages(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReorderStagesInput) => reorderStages(workspaceId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: stageKeys.list(workspaceId) });

      const previousStages = queryClient.getQueryData<Stage[]>(stageKeys.list(workspaceId));

      // Optimistic update
      queryClient.setQueryData<Stage[]>(stageKeys.list(workspaceId), (old) => {
        if (!old) return old;
        return old
          .map((stage) => {
            const updated = input.stages.find((s) => s.id === stage.id);
            return updated ? { ...stage, position: updated.position } : stage;
          })
          .sort((a, b) => a.position - b.position);
      });

      return { previousStages };
    },
    onError: (_err, _input, context) => {
      if (context?.previousStages) {
        queryClient.setQueryData(stageKeys.list(workspaceId), context.previousStages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: stageKeys.list(workspaceId) });
    },
  });
}

export function useDeleteStage(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stageId: string) => deleteStage(workspaceId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stageKeys.list(workspaceId) });
    },
  });
}
