import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { Deal, CreateDealInput, UpdateDealInput } from '@anso/types';

import { apiClient } from '@/lib/api-client';
import { stageKeys } from './stages';

// Extended Deal type with relations
export interface DealWithRelations extends Omit<Deal, 'contact' | 'stage'> {
  contact: { id: string; name: string } | null;
  stage: { id: string; name: string; color: string };
}

// Query keys
export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (workspaceId: string) => [...dealKeys.lists(), workspaceId] as const,
  detail: (workspaceId: string, id: string) => [...dealKeys.all, 'detail', workspaceId, id] as const,
};

// API functions
async function fetchDeals(workspaceId: string): Promise<DealWithRelations[]> {
  const response = await apiClient.get<DealWithRelations[]>(`/workspaces/${workspaceId}/deals`);
  return response.data;
}

async function createDeal(workspaceId: string, input: CreateDealInput): Promise<DealWithRelations> {
  const response = await apiClient.post<DealWithRelations>(`/workspaces/${workspaceId}/deals`, input);
  return response.data;
}

async function updateDeal(
  workspaceId: string,
  dealId: string,
  input: UpdateDealInput
): Promise<DealWithRelations> {
  const response = await apiClient.patch<DealWithRelations>(
    `/workspaces/${workspaceId}/deals/${dealId}`,
    input
  );
  return response.data;
}

async function deleteDeal(workspaceId: string, dealId: string): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}/deals/${dealId}`);
}

// Hooks
export function useDeals(workspaceId: string) {
  return useQuery({
    queryKey: dealKeys.list(workspaceId),
    queryFn: () => fetchDeals(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateDeal(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDealInput) => createDeal(workspaceId, input),
    onMutate: async (newDeal) => {
      await queryClient.cancelQueries({ queryKey: dealKeys.list(workspaceId) });

      const previousDeals = queryClient.getQueryData<DealWithRelations[]>(dealKeys.list(workspaceId));

      // Optimistic update
      queryClient.setQueryData<DealWithRelations[]>(dealKeys.list(workspaceId), (old) => {
        if (!old) return old;
        const optimisticDeal: DealWithRelations = {
          id: `temp-${Date.now()}`,
          workspaceId,
          title: newDeal.title,
          value: newDeal.value ?? null,
          stageId: newDeal.stageId,
          contactId: newDeal.contactId ?? null,
          contact: null,
          stage: { id: newDeal.stageId, name: '', color: '' },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return [optimisticDeal, ...old];
      });

      return { previousDeals };
    },
    onError: (_err, _newDeal, context) => {
      if (context?.previousDeals) {
        queryClient.setQueryData(dealKeys.list(workspaceId), context.previousDeals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.list(workspaceId) });
    },
  });
}

export function useUpdateDeal(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, input }: { dealId: string; input: UpdateDealInput }) =>
      updateDeal(workspaceId, dealId, input),
    onMutate: async ({ dealId, input }) => {
      await queryClient.cancelQueries({ queryKey: dealKeys.list(workspaceId) });

      const previousDeals = queryClient.getQueryData<DealWithRelations[]>(dealKeys.list(workspaceId));

      // Optimistic update
      queryClient.setQueryData<DealWithRelations[]>(dealKeys.list(workspaceId), (old) => {
        if (!old) return old;
        return old.map((deal) =>
          deal.id === dealId
            ? {
                ...deal,
                ...input,
                stageId: input.stageId ?? deal.stageId,
                updatedAt: new Date(),
              }
            : deal
        );
      });

      return { previousDeals };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousDeals) {
        queryClient.setQueryData(dealKeys.list(workspaceId), context.previousDeals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.list(workspaceId) });
      queryClient.invalidateQueries({ queryKey: stageKeys.list(workspaceId) });
    },
  });
}

export function useMoveDeal(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      updateDeal(workspaceId, dealId, { stageId }),
    onMutate: async ({ dealId, stageId }) => {
      await queryClient.cancelQueries({ queryKey: dealKeys.list(workspaceId) });

      const previousDeals = queryClient.getQueryData<DealWithRelations[]>(dealKeys.list(workspaceId));

      // Optimistic update - move deal to new stage
      queryClient.setQueryData<DealWithRelations[]>(dealKeys.list(workspaceId), (old) => {
        if (!old) return old;
        return old.map((deal) =>
          deal.id === dealId
            ? { ...deal, stageId, updatedAt: new Date() }
            : deal
        );
      });

      return { previousDeals };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousDeals) {
        queryClient.setQueryData(dealKeys.list(workspaceId), context.previousDeals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.list(workspaceId) });
    },
  });
}

export function useDeleteDeal(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dealId: string) => deleteDeal(workspaceId, dealId),
    onMutate: async (dealId) => {
      await queryClient.cancelQueries({ queryKey: dealKeys.list(workspaceId) });

      const previousDeals = queryClient.getQueryData<DealWithRelations[]>(dealKeys.list(workspaceId));

      // Optimistic delete
      queryClient.setQueryData<DealWithRelations[]>(dealKeys.list(workspaceId), (old) => {
        if (!old) return old;
        return old.filter((deal) => deal.id !== dealId);
      });

      return { previousDeals };
    },
    onError: (_err, _dealId, context) => {
      if (context?.previousDeals) {
        queryClient.setQueryData(dealKeys.list(workspaceId), context.previousDeals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.list(workspaceId) });
    },
  });
}
