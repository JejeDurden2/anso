import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';

import type { Workspace, WorkspaceMember } from '@anso/types';

import { apiClient } from '@/lib/api-client';

// Store for current workspace
interface WorkspaceStore {
  currentWorkspaceId: string | null;
  setCurrentWorkspaceId: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  currentWorkspaceId: null,
  setCurrentWorkspaceId: (id) => set({ currentWorkspaceId: id }),
}));

// Query keys
export const workspaceKeys = {
  all: ['workspaces'] as const,
  list: () => [...workspaceKeys.all, 'list'] as const,
  detail: (id: string) => [...workspaceKeys.all, 'detail', id] as const,
};

// Types
interface WorkspaceWithMember extends Workspace {
  members?: WorkspaceMember[];
}

// API functions
async function fetchWorkspaces(): Promise<WorkspaceWithMember[]> {
  const response = await apiClient.get<WorkspaceWithMember[]>('/workspaces');
  return response.data;
}

// Hooks
export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: fetchWorkspaces,
  });
}

export function useCurrentWorkspace() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const { currentWorkspaceId, setCurrentWorkspaceId } = useWorkspaceStore();

  // Auto-select first workspace if none selected
  if (!currentWorkspaceId && workspaces?.length) {
    setCurrentWorkspaceId(workspaces[0].id);
  }

  const currentWorkspace = workspaces?.find((w) => w.id === currentWorkspaceId) || workspaces?.[0];

  return {
    workspace: currentWorkspace,
    workspaceId: currentWorkspace?.id || '',
    workspaces: workspaces || [],
    isLoading,
    setCurrentWorkspaceId,
  };
}
