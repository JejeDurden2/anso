import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

// Types
export type Plan = 'FREE' | 'SOLO' | 'TEAM';

export interface PlanInfo {
  plan: Plan;
  contactLimit: number | null;
  contactCount: number;
  hasSubscription: boolean;
}

export interface CheckoutSessionResponse {
  url: string;
}

export interface PortalSessionResponse {
  url: string;
}

// API functions
async function createCheckoutSession(
  workspaceId: string,
  plan: Plan,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const response = await apiClient.post<CheckoutSessionResponse>(
    `/workspaces/${workspaceId}/billing/checkout`,
    { plan, successUrl, cancelUrl }
  );
  return response.data.url;
}

async function createPortalSession(workspaceId: string, returnUrl: string): Promise<string> {
  const response = await apiClient.post<PortalSessionResponse>(
    `/workspaces/${workspaceId}/billing/portal`,
    { returnUrl }
  );
  return response.data.url;
}

// Hooks
export function useCreateCheckoutSession(workspaceId: string) {
  return useMutation({
    mutationFn: ({ plan, successUrl, cancelUrl }: { plan: Plan; successUrl: string; cancelUrl: string }) =>
      createCheckoutSession(workspaceId, plan, successUrl, cancelUrl),
    onSuccess: (url) => {
      // Redirect to Stripe checkout
      window.location.href = url;
    },
  });
}

export function useCreatePortalSession(workspaceId: string) {
  return useMutation({
    mutationFn: ({ returnUrl }: { returnUrl: string }) => createPortalSession(workspaceId, returnUrl),
    onSuccess: (url) => {
      // Redirect to Stripe customer portal
      window.location.href = url;
    },
  });
}

// Plan configuration (for display purposes)
export const PLAN_CONFIG = {
  FREE: {
    name: 'Gratuit',
    price: 0,
    contactLimit: 10,
    features: ['10 contacts max', '1 utilisateur', 'Pipeline personnalisable', 'Support email'],
  },
  SOLO: {
    name: 'Solo',
    price: 10,
    contactLimit: null,
    features: ['Contacts illimités', '1 utilisateur', 'Pipeline personnalisable', 'Support prioritaire', 'Export CSV'],
  },
  TEAM: {
    name: 'Team',
    price: 20,
    contactLimit: null,
    features: ['Contacts illimités', '3 utilisateurs', 'Pipeline personnalisable', 'Support prioritaire', 'Export CSV', 'Rapports avancés'],
  },
} as const;
