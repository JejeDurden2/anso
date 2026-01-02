import type {
  Contact,
  CreateContactInput,
  UpdateContactInput,
  PaginatedResponse,
} from '@anso/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


import { apiClient } from '@/lib/api-client';

// Query keys
export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (workspaceId: string, filters: ContactFilters) =>
    [...contactKeys.lists(), workspaceId, filters] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (workspaceId: string, id: string) =>
    [...contactKeys.details(), workspaceId, id] as const,
  tags: (workspaceId: string) => [...contactKeys.all, 'tags', workspaceId] as const,
};

// Types
export interface ContactFilters {
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

type ContactListResponse = PaginatedResponse<Contact>;

// API functions
async function fetchContacts(
  workspaceId: string,
  filters: ContactFilters
): Promise<ContactListResponse> {
  const params: Record<string, string | number | boolean> = {};

  if (filters.search) params.search = filters.search;
  if (filters.tags?.length) params.tags = filters.tags.join(',');
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  const response = await apiClient.get<Contact[]>(
    `/workspaces/${workspaceId}/contacts`,
    { params }
  );

  return response as unknown as ContactListResponse;
}

async function fetchContact(
  workspaceId: string,
  contactId: string
): Promise<Contact> {
  const response = await apiClient.get<Contact>(
    `/workspaces/${workspaceId}/contacts/${contactId}`
  );
  return response.data;
}

async function fetchTags(workspaceId: string): Promise<string[]> {
  const response = await apiClient.get<string[]>(
    `/workspaces/${workspaceId}/contacts/tags`
  );
  return response.data;
}

async function createContact(
  workspaceId: string,
  input: CreateContactInput
): Promise<Contact> {
  const response = await apiClient.post<Contact>(
    `/workspaces/${workspaceId}/contacts`,
    input
  );
  return response.data;
}

async function updateContact(
  workspaceId: string,
  contactId: string,
  input: UpdateContactInput
): Promise<Contact> {
  const response = await apiClient.patch<Contact>(
    `/workspaces/${workspaceId}/contacts/${contactId}`,
    input
  );
  return response.data;
}

async function deleteContact(
  workspaceId: string,
  contactId: string
): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}/contacts/${contactId}`);
}

// Hooks
export function useContacts(workspaceId: string, filters: ContactFilters = {}) {
  return useQuery({
    queryKey: contactKeys.list(workspaceId, filters),
    queryFn: () => fetchContacts(workspaceId, filters),
    enabled: !!workspaceId,
  });
}

export function useContact(workspaceId: string, contactId: string) {
  return useQuery({
    queryKey: contactKeys.detail(workspaceId, contactId),
    queryFn: () => fetchContact(workspaceId, contactId),
    enabled: !!workspaceId && !!contactId,
  });
}

export function useContactTags(workspaceId: string) {
  return useQuery({
    queryKey: contactKeys.tags(workspaceId),
    queryFn: () => fetchTags(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateContact(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateContactInput) => createContact(workspaceId, input),
    onMutate: async (newContact) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: contactKeys.lists() });

      // Snapshot previous value
      const previousContacts = queryClient.getQueriesData({
        queryKey: contactKeys.lists(),
      });

      // Optimistically update the cache
      queryClient.setQueriesData<ContactListResponse>(
        { queryKey: contactKeys.lists() },
        (old) => {
          if (!old) return old;
          const optimisticContact: Contact = {
            id: `temp-${Date.now()}`,
            workspaceId,
            name: newContact.name,
            email: newContact.email || null,
            phone: newContact.phone || null,
            company: newContact.company || null,
            notes: newContact.notes || null,
            tags: newContact.tags || [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return {
            ...old,
            data: [optimisticContact, ...old.data],
            pagination: {
              ...old.pagination,
              total: old.pagination.total + 1,
            },
          };
        }
      );

      return { previousContacts };
    },
    onError: (_err, _newContact, context) => {
      // Rollback on error
      context?.previousContacts.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      // Refetch after success or error
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactKeys.tags(workspaceId) });
    },
  });
}

export function useUpdateContact(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contactId,
      input,
    }: {
      contactId: string;
      input: UpdateContactInput;
    }) => updateContact(workspaceId, contactId, input),
    onMutate: async ({ contactId, input }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: contactKeys.detail(workspaceId, contactId),
      });

      // Snapshot previous value
      const previousContact = queryClient.getQueryData<Contact>(
        contactKeys.detail(workspaceId, contactId)
      );

      // Optimistically update
      if (previousContact) {
        queryClient.setQueryData<Contact>(
          contactKeys.detail(workspaceId, contactId),
          {
            ...previousContact,
            ...input,
            updatedAt: new Date(),
          }
        );
      }

      // Update in list caches
      queryClient.setQueriesData<ContactListResponse>(
        { queryKey: contactKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((c) =>
              c.id === contactId ? { ...c, ...input, updatedAt: new Date() } : c
            ),
          };
        }
      );

      return { previousContact };
    },
    onError: (_err, { contactId }, context) => {
      // Rollback on error
      if (context?.previousContact) {
        queryClient.setQueryData(
          contactKeys.detail(workspaceId, contactId),
          context.previousContact
        );
      }
    },
    onSettled: (_data, _error, { contactId }) => {
      queryClient.invalidateQueries({
        queryKey: contactKeys.detail(workspaceId, contactId),
      });
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactKeys.tags(workspaceId) });
    },
  });
}

export function useDeleteContact(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) => deleteContact(workspaceId, contactId),
    onMutate: async (contactId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: contactKeys.lists() });

      // Snapshot previous value
      const previousContacts = queryClient.getQueriesData({
        queryKey: contactKeys.lists(),
      });

      // Optimistically remove from cache
      queryClient.setQueriesData<ContactListResponse>(
        { queryKey: contactKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((c) => c.id !== contactId),
            pagination: {
              ...old.pagination,
              total: Math.max(0, old.pagination.total - 1),
            },
          };
        }
      );

      return { previousContacts };
    },
    onError: (_err, _contactId, context) => {
      // Rollback on error
      context?.previousContacts.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactKeys.tags(workspaceId) });
    },
  });
}
