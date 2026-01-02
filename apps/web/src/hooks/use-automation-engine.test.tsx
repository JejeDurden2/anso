import type { AutomationRule } from '@anso/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useEnabledAutomations } from '@/services/automations';
import type { DealWithRelations } from '@/services/deals';
import { useCreateTask } from '@/services/tasks';

import { useAutomationEngine } from './use-automation-engine';

// Mock the services
vi.mock('@/services/automations', () => ({
  useEnabledAutomations: vi.fn(),
}));

vi.mock('@/services/tasks', () => ({
  useCreateTask: vi.fn(),
}));


const mockUseEnabledAutomations = vi.mocked(useEnabledAutomations);
const mockUseCreateTask = vi.mocked(useCreateTask);

// Test utilities
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  function TestWrapper({ children }: { children: ReactNode }): JSX.Element {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return TestWrapper;
}

// Mock deal factory
function createMockDeal(overrides: Partial<DealWithRelations> = {}): DealWithRelations {
  const now = new Date();
  return {
    id: 'deal-1',
    workspaceId: 'ws-1',
    title: 'Test Deal',
    value: 1000,
    stageId: 'stage-1',
    contactId: null,
    contact: null,
    stage: { id: 'stage-1', name: 'New', color: '#000' },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// Mock automation rule factory
function createMockRule(overrides: Partial<AutomationRule> = {}): AutomationRule {
  return {
    id: 'rule-1',
    workspaceId: 'ws-1',
    name: 'Test Rule',
    enabled: true,
    trigger: {
      type: 'deal_stale',
      config: { staleDays: 7 },
    },
    action: {
      type: 'create_task',
      config: {
        taskTitle: 'Follow up',
        dueDaysFromNow: 1,
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('useAutomationEngine', () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseEnabledAutomations.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useEnabledAutomations>);

    mockUseCreateTask.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateTask>);
  });

  describe('checkStaleDeal', () => {
    it('creates task for stale deal matching rule', async () => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      const staleDeal = createMockDeal({
        id: 'stale-deal',
        updatedAt: eightDaysAgo,
      });

      const staleRule = createMockRule({
        trigger: { type: 'deal_stale', config: { staleDays: 7 } },
        action: {
          type: 'create_task',
          config: { taskTitle: 'Follow up stale deal', dueDaysFromNow: 1 },
        },
      });

      mockUseEnabledAutomations.mockReturnValue({
        data: [staleRule],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useEnabledAutomations>);

      mockMutateAsync.mockResolvedValue({});

      const { result } = renderHook(
        () =>
          useAutomationEngine({
            workspaceId: 'ws-1',
            deals: [staleDeal],
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.checkStaleDeal(staleDeal);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          dealId: 'stale-deal',
          title: 'Follow up stale deal',
          source: 'automation',
          automationRuleId: 'rule-1',
        })
      );
    });

    it('does not create task for fresh deal', async () => {
      const freshDeal = createMockDeal({
        id: 'fresh-deal',
        updatedAt: new Date(), // Just updated
      });

      const staleRule = createMockRule({
        trigger: { type: 'deal_stale', config: { staleDays: 7 } },
      });

      mockUseEnabledAutomations.mockReturnValue({
        data: [staleRule],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useEnabledAutomations>);

      const { result } = renderHook(
        () =>
          useAutomationEngine({
            workspaceId: 'ws-1',
            deals: [freshDeal],
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.checkStaleDeal(freshDeal);
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('checkStageChange', () => {
    it('creates task when deal moves to target stage', async () => {
      const deal = createMockDeal({ id: 'deal-1', stageId: 'stage-2' });

      const stageChangeRule = createMockRule({
        trigger: {
          type: 'deal_stage_changed',
          config: { toStageId: 'stage-2' },
        },
        action: {
          type: 'create_task',
          config: { taskTitle: 'Stage changed task', dueDaysFromNow: 2 },
        },
      });

      mockUseEnabledAutomations.mockReturnValue({
        data: [stageChangeRule],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useEnabledAutomations>);

      mockMutateAsync.mockResolvedValue({});

      const { result } = renderHook(
        () =>
          useAutomationEngine({
            workspaceId: 'ws-1',
            deals: [deal],
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.checkStageChange(deal, 'stage-1', 'stage-2');
      });

      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          dealId: 'deal-1',
          title: 'Stage changed task',
        })
      );
    });

    it('does not create task when target stage does not match', async () => {
      const deal = createMockDeal({ id: 'deal-1', stageId: 'stage-3' });

      const stageChangeRule = createMockRule({
        trigger: {
          type: 'deal_stage_changed',
          config: { toStageId: 'stage-2' }, // Different target
        },
      });

      mockUseEnabledAutomations.mockReturnValue({
        data: [stageChangeRule],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useEnabledAutomations>);

      const { result } = renderHook(
        () =>
          useAutomationEngine({
            workspaceId: 'ws-1',
            deals: [deal],
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.checkStageChange(deal, 'stage-1', 'stage-3');
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('checks fromStageId when specified', async () => {
      const deal = createMockDeal({ id: 'deal-1', stageId: 'stage-2' });

      const stageChangeRule = createMockRule({
        trigger: {
          type: 'deal_stage_changed',
          config: { fromStageId: 'stage-1', toStageId: 'stage-2' },
        },
      });

      mockUseEnabledAutomations.mockReturnValue({
        data: [stageChangeRule],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useEnabledAutomations>);

      mockMutateAsync.mockResolvedValue({});

      const { result } = renderHook(
        () =>
          useAutomationEngine({
            workspaceId: 'ws-1',
            deals: [deal],
          }),
        { wrapper: createWrapper() }
      );

      // Should trigger: moving from stage-1 to stage-2
      await act(async () => {
        result.current.checkStageChange(deal, 'stage-1', 'stage-2');
      });

      expect(mockMutateAsync).toHaveBeenCalled();
    });

    it('does not trigger when fromStageId does not match', async () => {
      const deal = createMockDeal({ id: 'deal-1', stageId: 'stage-2' });

      const stageChangeRule = createMockRule({
        trigger: {
          type: 'deal_stage_changed',
          config: { fromStageId: 'stage-3', toStageId: 'stage-2' }, // Requires from stage-3
        },
      });

      mockUseEnabledAutomations.mockReturnValue({
        data: [stageChangeRule],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useEnabledAutomations>);

      const { result } = renderHook(
        () =>
          useAutomationEngine({
            workspaceId: 'ws-1',
            deals: [deal],
          }),
        { wrapper: createWrapper() }
      );

      // Moving from stage-1, but rule requires stage-3
      await act(async () => {
        result.current.checkStageChange(deal, 'stage-1', 'stage-2');
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('checkNewDeal', () => {
    it('creates task for new deal', async () => {
      const newDeal = createMockDeal({ id: 'new-deal' });

      const newDealRule = createMockRule({
        trigger: { type: 'deal_created', config: {} },
        action: {
          type: 'create_task',
          config: { taskTitle: 'Welcome new deal', dueDaysFromNow: 0 },
        },
      });

      mockUseEnabledAutomations.mockReturnValue({
        data: [newDealRule],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useEnabledAutomations>);

      mockMutateAsync.mockResolvedValue({});

      const { result } = renderHook(
        () =>
          useAutomationEngine({
            workspaceId: 'ws-1',
            deals: [newDeal],
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.checkNewDeal(newDeal);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          dealId: 'new-deal',
          title: 'Welcome new deal',
        })
      );
    });

    it('creates task only for matching stage', async () => {
      const dealInStage1 = createMockDeal({ id: 'deal-1', stageId: 'stage-1' });
      const dealInStage2 = createMockDeal({ id: 'deal-2', stageId: 'stage-2' });

      const newDealRule = createMockRule({
        trigger: { type: 'deal_created', config: { stageId: 'stage-1' } },
      });

      mockUseEnabledAutomations.mockReturnValue({
        data: [newDealRule],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useEnabledAutomations>);

      mockMutateAsync.mockResolvedValue({});

      const { result } = renderHook(
        () =>
          useAutomationEngine({
            workspaceId: 'ws-1',
            deals: [dealInStage1, dealInStage2],
          }),
        { wrapper: createWrapper() }
      );

      // Should trigger for deal in stage-1
      await act(async () => {
        result.current.checkNewDeal(dealInStage1);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ dealId: 'deal-1' })
      );

      mockMutateAsync.mockClear();

      // Should NOT trigger for deal in stage-2
      await act(async () => {
        result.current.checkNewDeal(dealInStage2);
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('duplicate prevention', () => {
    it('does not create duplicate tasks for same deal-rule combination', async () => {
      const staleDeal = createMockDeal({
        id: 'stale-deal',
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      });

      const staleRule = createMockRule({
        id: 'rule-1',
        trigger: { type: 'deal_stale', config: { staleDays: 7 } },
      });

      mockUseEnabledAutomations.mockReturnValue({
        data: [staleRule],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useEnabledAutomations>);

      mockMutateAsync.mockResolvedValue({});

      const { result } = renderHook(
        () =>
          useAutomationEngine({
            workspaceId: 'ws-1',
            deals: [staleDeal],
          }),
        { wrapper: createWrapper() }
      );

      // First check should create task
      await act(async () => {
        result.current.checkStaleDeal(staleDeal);
      });

      expect(mockMutateAsync).toHaveBeenCalledTimes(1);

      // Second check should not create duplicate
      await act(async () => {
        result.current.checkStaleDeal(staleDeal);
      });

      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('callback', () => {
    it('calls onTaskCreated callback when task is created', async () => {
      const onTaskCreated = vi.fn();
      const newDeal = createMockDeal({ id: 'new-deal', title: 'Big Deal' });

      const newDealRule = createMockRule({
        trigger: { type: 'deal_created', config: {} },
        action: {
          type: 'create_task',
          config: { taskTitle: 'Contact prospect', dueDaysFromNow: 1 },
        },
      });

      mockUseEnabledAutomations.mockReturnValue({
        data: [newDealRule],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useEnabledAutomations>);

      mockMutateAsync.mockResolvedValue({});

      const { result } = renderHook(
        () =>
          useAutomationEngine({
            workspaceId: 'ws-1',
            deals: [newDeal],
            onTaskCreated,
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.checkNewDeal(newDeal);
      });

      expect(onTaskCreated).toHaveBeenCalledWith('Contact prospect', 'Big Deal');
    });
  });
});
