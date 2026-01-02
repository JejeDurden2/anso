import type {
  AutomationRule,
  DealStaleTriggerConfig,
  DealStageChangedTriggerConfig,
  DealCreatedTriggerConfig,
  CreateTaskInput,
} from '@anso/types';
import { useCallback, useEffect, useRef } from 'react';

import { useEnabledAutomations } from '@/services/automations';
import { DealWithRelations } from '@/services/deals';
import { useCreateTask } from '@/services/tasks';

interface AutomationEngineOptions {
  workspaceId: string;
  deals: DealWithRelations[];
  onTaskCreated?: (taskTitle: string, dealTitle: string) => void;
}

interface AutomationEngineResult {
  checkStaleDeal: (deal: DealWithRelations) => void;
  checkStageChange: (deal: DealWithRelations, previousStageId: string, newStageId: string) => void;
  checkNewDeal: (deal: DealWithRelations) => void;
  runStaleDealsCheck: () => void;
}

// Helper to add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Check if a deal is stale (no updates in N days)
function isDealStale(deal: DealWithRelations, staleDays: number): boolean {
  const now = new Date();
  const lastUpdate = new Date(deal.updatedAt);
  const diffTime = now.getTime() - lastUpdate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= staleDays;
}

export function useAutomationEngine({
  workspaceId,
  deals,
  onTaskCreated,
}: AutomationEngineOptions): AutomationEngineResult {
  const { data: automations = [] } = useEnabledAutomations(workspaceId);
  const createTask = useCreateTask(workspaceId);

  // Track which automations have already been triggered for which deals
  // to avoid duplicate task creation
  const triggeredRef = useRef<Set<string>>(new Set());

  // Create a task from an automation rule
  const createTaskFromAutomation = useCallback(
    async (rule: AutomationRule, deal: DealWithRelations) => {
      const triggerKey = `${rule.id}-${deal.id}`;

      // Skip if already triggered for this deal
      if (triggeredRef.current.has(triggerKey)) {
        return;
      }

      // Mark as triggered
      triggeredRef.current.add(triggerKey);

      const taskInput: CreateTaskInput = {
        dealId: deal.id,
        title: rule.action.config.taskTitle.replace('{dealTitle}', deal.title),
        description: rule.action.config.taskDescription?.replace('{dealTitle}', deal.title),
        dueDate: addDays(new Date(), rule.action.config.dueDaysFromNow),
        source: 'automation',
        automationRuleId: rule.id,
      };

      try {
        await createTask.mutateAsync(taskInput);
        onTaskCreated?.(taskInput.title, deal.title);
      } catch {
        // Remove from triggered set on error so it can be retried
        triggeredRef.current.delete(triggerKey);
      }
    },
    [createTask, onTaskCreated]
  );

  // Check if a specific deal is stale and trigger automations
  const checkStaleDeal = useCallback(
    (deal: DealWithRelations) => {
      const staleRules = automations.filter((rule) => rule.trigger.type === 'deal_stale');

      for (const rule of staleRules) {
        const config = rule.trigger.config as DealStaleTriggerConfig;
        if (isDealStale(deal, config.staleDays)) {
          createTaskFromAutomation(rule, deal);
        }
      }
    },
    [automations, createTaskFromAutomation]
  );

  // Check stage change and trigger automations
  const checkStageChange = useCallback(
    (deal: DealWithRelations, previousStageId: string, newStageId: string) => {
      const stageChangeRules = automations.filter(
        (rule) => rule.trigger.type === 'deal_stage_changed'
      );

      for (const rule of stageChangeRules) {
        const config = rule.trigger.config as DealStageChangedTriggerConfig;

        // Check if the stage change matches the trigger config
        const fromMatches = !config.fromStageId || config.fromStageId === previousStageId;
        const toMatches = config.toStageId === newStageId;

        if (fromMatches && toMatches) {
          createTaskFromAutomation(rule, deal);
        }
      }
    },
    [automations, createTaskFromAutomation]
  );

  // Check new deal creation and trigger automations
  const checkNewDeal = useCallback(
    (deal: DealWithRelations) => {
      const newDealRules = automations.filter((rule) => rule.trigger.type === 'deal_created');

      for (const rule of newDealRules) {
        const config = rule.trigger.config as DealCreatedTriggerConfig;

        // Check if stage filter matches (if specified)
        const stageMatches = !config.stageId || config.stageId === deal.stageId;

        if (stageMatches) {
          createTaskFromAutomation(rule, deal);
        }
      }
    },
    [automations, createTaskFromAutomation]
  );

  // Run a check on all deals for stale deal automations
  const runStaleDealsCheck = useCallback(() => {
    const staleRules = automations.filter((rule) => rule.trigger.type === 'deal_stale');

    if (staleRules.length === 0) return;

    for (const deal of deals) {
      for (const rule of staleRules) {
        const config = rule.trigger.config as DealStaleTriggerConfig;
        if (isDealStale(deal, config.staleDays)) {
          createTaskFromAutomation(rule, deal);
        }
      }
    }
  }, [automations, deals, createTaskFromAutomation]);

  // Run stale deals check on mount and when automations/deals change
  useEffect(() => {
    if (automations.length > 0 && deals.length > 0) {
      // Delay slightly to avoid running during initial render
      const timeoutId = setTimeout(() => {
        runStaleDealsCheck();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [automations.length, deals.length, runStaleDealsCheck]);

  return {
    checkStaleDeal,
    checkStageChange,
    checkNewDeal,
    runStaleDealsCheck,
  };
}
