import type { AutomationRule } from '@anso/types';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { render } from '@/test/utils';

import { AutomationRuleCard } from './automation-rule-card';

// Mock automation rule factory
function createMockRule(overrides: Partial<AutomationRule> = {}): AutomationRule {
  return {
    id: 'rule-1',
    workspaceId: 'ws-1',
    name: 'Test Automation',
    description: 'Test description',
    enabled: true,
    trigger: {
      type: 'deal_stale',
      config: { staleDays: 7 },
    },
    action: {
      type: 'create_task',
      config: {
        taskTitle: 'Follow up',
        taskDescription: 'Follow up on the deal',
        dueDaysFromNow: 1,
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AutomationRuleCard', () => {
  const mockOnToggle = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockStageName = vi.fn((id: string) => `Stage ${id}`);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders rule name and description', () => {
      const rule = createMockRule({
        name: 'My Automation',
        description: 'My description',
      });

      render(
        <AutomationRuleCard
          rule={rule}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText('My Automation')).toBeInTheDocument();
      expect(screen.getByText('My description')).toBeInTheDocument();
    });

    it('renders without description', () => {
      const rule = createMockRule({ description: undefined });

      render(
        <AutomationRuleCard
          rule={rule}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText('Test Automation')).toBeInTheDocument();
    });

    it('renders enabled rule with proper styling', () => {
      const rule = createMockRule({ enabled: true });

      render(
        <AutomationRuleCard
          rule={rule}
          onToggle={mockOnToggle}
        />
      );

      // The Card component wraps everything and includes p-4 and ring-brand-200 when enabled
      const card = screen.getByText('Test Automation').closest('div[class*="rounded-lg"]');
      expect(card).toHaveClass('ring-brand-200');
    });

    it('renders disabled rule with reduced opacity', () => {
      const rule = createMockRule({ enabled: false });

      render(
        <AutomationRuleCard
          rule={rule}
          onToggle={mockOnToggle}
        />
      );

      // The Card component wraps everything and includes p-4 and opacity-60 when disabled
      const card = screen.getByText('Test Automation').closest('div[class*="rounded-lg"]');
      expect(card).toHaveClass('opacity-60');
    });
  });

  describe('trigger descriptions', () => {
    it('shows deal_stale trigger description', () => {
      const rule = createMockRule({
        trigger: { type: 'deal_stale', config: { staleDays: 7 } },
      });

      render(
        <AutomationRuleCard
          rule={rule}
          onToggle={mockOnToggle}
        />
      );

      expect(
        screen.getByText('Quand un deal est inactif depuis 7 jours')
      ).toBeInTheDocument();
    });

    it('shows deal_stale trigger with singular day', () => {
      const rule = createMockRule({
        trigger: { type: 'deal_stale', config: { staleDays: 1 } },
      });

      render(
        <AutomationRuleCard
          rule={rule}
          onToggle={mockOnToggle}
        />
      );

      expect(
        screen.getByText('Quand un deal est inactif depuis 1 jour')
      ).toBeInTheDocument();
    });

    it('shows deal_created trigger description', () => {
      const rule = createMockRule({
        trigger: { type: 'deal_created', config: {} },
      });

      render(
        <AutomationRuleCard
          rule={rule}
          onToggle={mockOnToggle}
        />
      );

      expect(
        screen.getByText('Quand un nouveau deal est créé')
      ).toBeInTheDocument();
    });

    it('shows deal_created trigger with stage filter', () => {
      const rule = createMockRule({
        trigger: { type: 'deal_created', config: { stageId: 'stage-1' } },
      });

      render(
        <AutomationRuleCard
          rule={rule}
          stageName={mockStageName}
          onToggle={mockOnToggle}
        />
      );

      expect(
        screen.getByText('Quand un deal est créé dans "Stage stage-1"')
      ).toBeInTheDocument();
    });

    it('shows deal_stage_changed trigger description', () => {
      const rule = createMockRule({
        trigger: {
          type: 'deal_stage_changed',
          config: { toStageId: 'stage-2' },
        },
      });

      render(
        <AutomationRuleCard
          rule={rule}
          stageName={mockStageName}
          onToggle={mockOnToggle}
        />
      );

      expect(
        screen.getByText('Quand un deal entre dans "Stage stage-2"')
      ).toBeInTheDocument();
    });

    it('shows deal_stage_changed with from and to stages', () => {
      const rule = createMockRule({
        trigger: {
          type: 'deal_stage_changed',
          config: { fromStageId: 'stage-1', toStageId: 'stage-2' },
        },
      });

      render(
        <AutomationRuleCard
          rule={rule}
          stageName={mockStageName}
          onToggle={mockOnToggle}
        />
      );

      expect(
        screen.getByText('Quand un deal passe de "Stage stage-1" à "Stage stage-2"')
      ).toBeInTheDocument();
    });
  });

  describe('action descriptions', () => {
    it('shows create_task action description', () => {
      const rule = createMockRule({
        action: {
          type: 'create_task',
          config: {
            taskTitle: 'My Task',
            dueDaysFromNow: 3,
          },
        },
      });

      render(
        <AutomationRuleCard
          rule={rule}
          onToggle={mockOnToggle}
        />
      );

      expect(
        screen.getByText('Créer la tâche "My Task" (échéance dans 3 jours)')
      ).toBeInTheDocument();
    });

    it('shows singular day in action description', () => {
      const rule = createMockRule({
        action: {
          type: 'create_task',
          config: {
            taskTitle: 'My Task',
            dueDaysFromNow: 1,
          },
        },
      });

      render(
        <AutomationRuleCard
          rule={rule}
          onToggle={mockOnToggle}
        />
      );

      expect(
        screen.getByText('Créer la tâche "My Task" (échéance dans 1 jour)')
      ).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onToggle when switch is clicked', async () => {
      const user = userEvent.setup();
      const rule = createMockRule({ enabled: true });

      render(
        <AutomationRuleCard
          rule={rule}
          onToggle={mockOnToggle}
        />
      );

      const switchElement = screen.getByRole('switch');
      await user.click(switchElement);

      expect(mockOnToggle).toHaveBeenCalledWith(false);
    });

    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const rule = createMockRule();

      render(
        <AutomationRuleCard
          rule={rule}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByText('Modifier');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalled();
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const rule = createMockRule();

      render(
        <AutomationRuleCard
          rule={rule}
          onToggle={mockOnToggle}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByText('Supprimer');
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalled();
    });

    it('does not show edit/delete buttons when handlers not provided', () => {
      const rule = createMockRule();

      render(
        <AutomationRuleCard
          rule={rule}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.queryByText('Modifier')).not.toBeInTheDocument();
      expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();
    });

    it('disables switch when isToggling is true', () => {
      const rule = createMockRule();

      render(
        <AutomationRuleCard
          rule={rule}
          onToggle={mockOnToggle}
          isToggling
        />
      );

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeDisabled();
    });
  });
});
