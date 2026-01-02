import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { TaskWithDeal } from '@/services/tasks';
import { render } from '@/test/utils';

import { TaskList } from './task-list';

// Mock task factory
function createMockTask(overrides: Partial<TaskWithDeal> = {}): TaskWithDeal {
  return {
    id: 'task-1',
    workspaceId: 'ws-1',
    dealId: 'deal-1',
    title: 'Test Task',
    description: 'Task description',
    dueDate: new Date(),
    completed: false,
    source: 'manual',
    deal: { id: 'deal-1', title: 'Test Deal', value: 1000 },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('TaskList', () => {
  const mockOnToggle = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders empty state when no tasks', () => {
      render(
        <TaskList
          tasks={[]}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText('Aucune tâche en attente')).toBeInTheDocument();
      expect(screen.getByText('Vous êtes à jour !')).toBeInTheDocument();
    });

    it('renders custom empty message', () => {
      render(
        <TaskList
          tasks={[]}
          onToggle={mockOnToggle}
          emptyMessage="Pas de tâches"
        />
      );

      expect(screen.getByText('Pas de tâches')).toBeInTheDocument();
    });

    it('renders loading skeleton', () => {
      render(
        <TaskList
          tasks={[]}
          isLoading
          onToggle={mockOnToggle}
        />
      );

      // Should show loading skeletons, not empty state
      expect(screen.queryByText('Aucune tâche en attente')).not.toBeInTheDocument();
    });

    it('renders tasks', () => {
      const tasks = [
        createMockTask({ id: 'task-1', title: 'Task 1' }),
        createMockTask({ id: 'task-2', title: 'Task 2' }),
      ];

      render(
        <TaskList
          tasks={tasks}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    it('shows automation badge for automated tasks', () => {
      const task = createMockTask({
        source: 'automation',
        automationRuleId: 'rule-1',
      });

      render(
        <TaskList
          tasks={[task]}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText('Auto')).toBeInTheDocument();
    });

    it('does not show automation badge for manual tasks', () => {
      const task = createMockTask({ source: 'manual' });

      render(
        <TaskList
          tasks={[task]}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.queryByText('Auto')).not.toBeInTheDocument();
    });

    it('shows deal link when showDealLink is true', () => {
      const task = createMockTask({
        deal: { id: 'deal-1', title: 'Important Deal', value: 5000 },
      });

      render(
        <TaskList
          tasks={[task]}
          onToggle={mockOnToggle}
          showDealLink
        />
      );

      expect(screen.getByText('Important Deal')).toBeInTheDocument();
    });
  });

  describe('due date display', () => {
    it('shows "Aujourd\'hui" for tasks due today', () => {
      const task = createMockTask({
        dueDate: new Date(),
      });

      render(
        <TaskList
          tasks={[task]}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
    });

    it('shows "Demain" for tasks due tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const task = createMockTask({
        dueDate: tomorrow,
      });

      render(
        <TaskList
          tasks={[task]}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText('Demain')).toBeInTheDocument();
    });

    it('shows overdue indicator for past due tasks', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const task = createMockTask({
        dueDate: yesterday,
      });

      render(
        <TaskList
          tasks={[task]}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText('Hier')).toBeInTheDocument();
    });

    it('does not show due date for completed tasks', () => {
      const task = createMockTask({
        completed: true,
        dueDate: new Date(),
      });

      render(
        <TaskList
          tasks={[task]}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.queryByText("Aujourd'hui")).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onToggle when checkbox is clicked', async () => {
      const user = userEvent.setup();
      const task = createMockTask({ id: 'task-1', completed: false });

      render(
        <TaskList
          tasks={[task]}
          onToggle={mockOnToggle}
        />
      );

      // Find and click the checkbox button (circle icon)
      const checkboxButtons = screen.getAllByRole('button');
      const checkboxButton = checkboxButtons.find(btn => !btn.title);
      if (checkboxButton) {
        await user.click(checkboxButton);
      }

      expect(mockOnToggle).toHaveBeenCalledWith('task-1', true);
    });

    it('calls onToggle to uncomplete when completed task is clicked', async () => {
      const user = userEvent.setup();
      const task = createMockTask({ id: 'task-1', completed: true });

      render(
        <TaskList
          tasks={[task]}
          onToggle={mockOnToggle}
        />
      );

      const checkboxButtons = screen.getAllByRole('button');
      const checkboxButton = checkboxButtons.find(btn => !btn.title);
      if (checkboxButton) {
        await user.click(checkboxButton);
      }

      expect(mockOnToggle).toHaveBeenCalledWith('task-1', false);
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const task = createMockTask({ id: 'task-1' });

      render(
        <TaskList
          tasks={[task]}
          onToggle={mockOnToggle}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTitle('Supprimer');
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('task-1');
    });

    it('does not show delete button when onDelete is not provided', () => {
      const task = createMockTask();

      render(
        <TaskList
          tasks={[task]}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.queryByTitle('Supprimer')).not.toBeInTheDocument();
    });
  });

  describe('maxItems', () => {
    it('limits displayed tasks when maxItems is set', () => {
      const tasks = Array.from({ length: 10 }, (_, i) =>
        createMockTask({ id: `task-${i}`, title: `Task ${i}` })
      );

      render(
        <TaskList
          tasks={tasks}
          onToggle={mockOnToggle}
          maxItems={5}
        />
      );

      expect(screen.getByText('Task 0')).toBeInTheDocument();
      expect(screen.getByText('Task 4')).toBeInTheDocument();
      expect(screen.queryByText('Task 5')).not.toBeInTheDocument();
    });

    it('shows count of remaining tasks', () => {
      const tasks = Array.from({ length: 10 }, (_, i) =>
        createMockTask({ id: `task-${i}`, title: `Task ${i}` })
      );

      render(
        <TaskList
          tasks={tasks}
          onToggle={mockOnToggle}
          maxItems={5}
        />
      );

      expect(screen.getByText('+5 autres tâches')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies strikethrough to completed task titles', () => {
      const task = createMockTask({ completed: true, title: 'Completed Task' });

      render(
        <TaskList
          tasks={[task]}
          onToggle={mockOnToggle}
        />
      );

      const titleElement = screen.getByText('Completed Task');
      expect(titleElement).toHaveClass('line-through');
    });

    it('applies reduced opacity to completed tasks', () => {
      const task = createMockTask({ completed: true });

      render(
        <TaskList
          tasks={[task]}
          onToggle={mockOnToggle}
        />
      );

      // The task container should have opacity styling
      const taskContainer = screen.getByText('Test Task').closest('div[class*="ring"]');
      expect(taskContainer).toHaveClass('opacity-60');
    });
  });
});
