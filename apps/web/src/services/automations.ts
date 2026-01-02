import type {
  AutomationRule,
  CreateAutomationRuleInput,
  UpdateAutomationRuleInput,
} from '@anso/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

// Query keys
export const automationKeys = {
  all: ['automations'] as const,
  lists: () => [...automationKeys.all, 'list'] as const,
  list: (workspaceId: string) => [...automationKeys.lists(), workspaceId] as const,
  enabled: (workspaceId: string) => [...automationKeys.list(workspaceId), 'enabled'] as const,
  detail: (workspaceId: string, id: string) =>
    [...automationKeys.all, 'detail', workspaceId, id] as const,
};

// API functions
async function fetchAutomations(workspaceId: string): Promise<AutomationRule[]> {
  const response = await apiClient.get<AutomationRule[]>(
    `/workspaces/${workspaceId}/automations`
  );
  return response.data;
}

async function fetchEnabledAutomations(workspaceId: string): Promise<AutomationRule[]> {
  const response = await apiClient.get<AutomationRule[]>(
    `/workspaces/${workspaceId}/automations?enabled=true`
  );
  return response.data;
}

async function createAutomation(
  workspaceId: string,
  input: CreateAutomationRuleInput
): Promise<AutomationRule> {
  const response = await apiClient.post<AutomationRule>(
    `/workspaces/${workspaceId}/automations`,
    input
  );
  return response.data;
}

async function updateAutomation(
  workspaceId: string,
  automationId: string,
  input: UpdateAutomationRuleInput
): Promise<AutomationRule> {
  const response = await apiClient.patch<AutomationRule>(
    `/workspaces/${workspaceId}/automations/${automationId}`,
    input
  );
  return response.data;
}

async function deleteAutomation(workspaceId: string, automationId: string): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}/automations/${automationId}`);
}

async function toggleAutomation(
  workspaceId: string,
  automationId: string,
  enabled: boolean
): Promise<AutomationRule> {
  const response = await apiClient.patch<AutomationRule>(
    `/workspaces/${workspaceId}/automations/${automationId}`,
    { enabled }
  );
  return response.data;
}

// Hooks
export function useAutomations(workspaceId: string) {
  return useQuery({
    queryKey: automationKeys.list(workspaceId),
    queryFn: () => fetchAutomations(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useEnabledAutomations(workspaceId: string) {
  return useQuery({
    queryKey: automationKeys.enabled(workspaceId),
    queryFn: () => fetchEnabledAutomations(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateAutomation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAutomationRuleInput) => createAutomation(workspaceId, input),
    onMutate: async (newAutomation) => {
      await queryClient.cancelQueries({ queryKey: automationKeys.list(workspaceId) });

      const previousAutomations = queryClient.getQueryData<AutomationRule[]>(
        automationKeys.list(workspaceId)
      );

      // Optimistic update
      queryClient.setQueryData<AutomationRule[]>(automationKeys.list(workspaceId), (old) => {
        if (!old) return old;
        const optimisticAutomation: AutomationRule = {
          id: `temp-${Date.now()}`,
          workspaceId,
          name: newAutomation.name,
          description: newAutomation.description,
          enabled: newAutomation.enabled ?? true,
          trigger: newAutomation.trigger,
          action: newAutomation.action,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return [...old, optimisticAutomation];
      });

      return { previousAutomations };
    },
    onError: (_err, _newAutomation, context) => {
      if (context?.previousAutomations) {
        queryClient.setQueryData(automationKeys.list(workspaceId), context.previousAutomations);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.list(workspaceId) });
      queryClient.invalidateQueries({ queryKey: automationKeys.enabled(workspaceId) });
    },
  });
}

export function useUpdateAutomation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      automationId,
      input,
    }: {
      automationId: string;
      input: UpdateAutomationRuleInput;
    }) => updateAutomation(workspaceId, automationId, input),
    onMutate: async ({ automationId, input }) => {
      await queryClient.cancelQueries({ queryKey: automationKeys.list(workspaceId) });

      const previousAutomations = queryClient.getQueryData<AutomationRule[]>(
        automationKeys.list(workspaceId)
      );

      // Optimistic update
      queryClient.setQueryData<AutomationRule[]>(automationKeys.list(workspaceId), (old) => {
        if (!old) return old;
        return old.map((automation) =>
          automation.id === automationId
            ? {
                ...automation,
                ...input,
                updatedAt: new Date(),
              }
            : automation
        );
      });

      return { previousAutomations };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousAutomations) {
        queryClient.setQueryData(automationKeys.list(workspaceId), context.previousAutomations);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.list(workspaceId) });
      queryClient.invalidateQueries({ queryKey: automationKeys.enabled(workspaceId) });
    },
  });
}

export function useToggleAutomation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ automationId, enabled }: { automationId: string; enabled: boolean }) =>
      toggleAutomation(workspaceId, automationId, enabled),
    onMutate: async ({ automationId, enabled }) => {
      await queryClient.cancelQueries({ queryKey: automationKeys.list(workspaceId) });

      const previousAutomations = queryClient.getQueryData<AutomationRule[]>(
        automationKeys.list(workspaceId)
      );

      // Optimistic toggle
      queryClient.setQueryData<AutomationRule[]>(automationKeys.list(workspaceId), (old) => {
        if (!old) return old;
        return old.map((automation) =>
          automation.id === automationId
            ? {
                ...automation,
                enabled,
                updatedAt: new Date(),
              }
            : automation
        );
      });

      return { previousAutomations };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousAutomations) {
        queryClient.setQueryData(automationKeys.list(workspaceId), context.previousAutomations);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.list(workspaceId) });
      queryClient.invalidateQueries({ queryKey: automationKeys.enabled(workspaceId) });
    },
  });
}

export function useDeleteAutomation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (automationId: string) => deleteAutomation(workspaceId, automationId),
    onMutate: async (automationId) => {
      await queryClient.cancelQueries({ queryKey: automationKeys.list(workspaceId) });

      const previousAutomations = queryClient.getQueryData<AutomationRule[]>(
        automationKeys.list(workspaceId)
      );

      // Optimistic delete
      queryClient.setQueryData<AutomationRule[]>(automationKeys.list(workspaceId), (old) => {
        if (!old) return old;
        return old.filter((automation) => automation.id !== automationId);
      });

      return { previousAutomations };
    },
    onError: (_err, _automationId, context) => {
      if (context?.previousAutomations) {
        queryClient.setQueryData(automationKeys.list(workspaceId), context.previousAutomations);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.list(workspaceId) });
      queryClient.invalidateQueries({ queryKey: automationKeys.enabled(workspaceId) });
    },
  });
}

// Default automation rules for new workspaces
export const DEFAULT_AUTOMATION_RULES: CreateAutomationRuleInput[] = [
  {
    name: 'Relance deal inactif',
    description: "Crée une tâche de relance quand un deal n'a pas bougé depuis 7 jours",
    enabled: true,
    trigger: {
      type: 'deal_stale',
      config: { staleDays: 7 },
    },
    action: {
      type: 'create_task',
      config: {
        taskTitle: 'Relancer le deal',
        taskDescription: "Ce deal n'a pas évolué depuis 7 jours. Pensez à relancer le contact.",
        dueDaysFromNow: 1,
      },
    },
  },
  {
    name: 'Onboarding nouveau deal',
    description: 'Crée une tâche de premier contact quand un nouveau deal est créé',
    enabled: true,
    trigger: {
      type: 'deal_created',
      config: {},
    },
    action: {
      type: 'create_task',
      config: {
        taskTitle: 'Premier contact',
        taskDescription: 'Prenez contact avec le prospect pour qualifier le besoin.',
        dueDaysFromNow: 1,
      },
    },
  },
];
