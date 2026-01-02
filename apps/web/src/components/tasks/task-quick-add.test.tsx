import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { DealWithRelations } from '@/services/deals';
import { render } from '@/test/utils';

import { TaskQuickAdd } from './task-quick-add';

// Mock deal factory
function createMockDeal(overrides: Partial<DealWithRelations> = {}): DealWithRelations {
  return {
    id: 'deal-1',
    workspaceId: 'ws-1',
    title: 'Test Deal',
    value: 1000,
    stageId: 'stage-1',
    contactId: 'contact-1',
    contact: { id: 'contact-1', name: 'John Doe', email: 'john@example.com' },
    stage: { id: 'stage-1', name: 'Prospect', color: '#3B82F6', position: 0 },
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as DealWithRelations;
}

describe('TaskQuickAdd', () => {
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders input field', () => {
      render(
        <TaskQuickAdd
          deals={[createMockDeal()]}
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByPlaceholderText('Nouvelle tâche...')).toBeInTheDocument();
    });

    it('renders deal selector when no defaultDealId', () => {
      render(
        <TaskQuickAdd
          deals={[createMockDeal()]}
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByText('Choisir un deal')).toBeInTheDocument();
    });

    it('hides deal selector when defaultDealId is provided', () => {
      render(
        <TaskQuickAdd
          deals={[createMockDeal()]}
          onAdd={mockOnAdd}
          defaultDealId="deal-1"
        />
      );

      expect(screen.queryByText('Choisir un deal')).not.toBeInTheDocument();
    });

    it('renders date selector with default "Demain"', () => {
      render(
        <TaskQuickAdd
          deals={[createMockDeal()]}
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByText('Demain')).toBeInTheDocument();
    });

    it('disables input when loading', () => {
      render(
        <TaskQuickAdd
          deals={[createMockDeal()]}
          onAdd={mockOnAdd}
          isLoading
        />
      );

      expect(screen.getByPlaceholderText('Nouvelle tâche...')).toBeDisabled();
    });

    it('shows error message when error is provided', () => {
      const error = new Error('Network error');

      render(
        <TaskQuickAdd
          deals={[createMockDeal()]}
          onAdd={mockOnAdd}
          error={error}
        />
      );

      expect(screen.getByText(/Erreur lors de la création/)).toBeInTheDocument();
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  describe('deal selection', () => {
    it('opens deal picker on click', async () => {
      const user = userEvent.setup();
      const deals = [
        createMockDeal({ id: 'deal-1', title: 'Deal One' }),
        createMockDeal({ id: 'deal-2', title: 'Deal Two' }),
      ];

      render(
        <TaskQuickAdd
          deals={deals}
          onAdd={mockOnAdd}
        />
      );

      await user.click(screen.getByText('Choisir un deal'));

      expect(screen.getByText('Deal One')).toBeInTheDocument();
      expect(screen.getByText('Deal Two')).toBeInTheDocument();
    });

    it('selects deal when clicked', async () => {
      const user = userEvent.setup();
      const deals = [
        createMockDeal({ id: 'deal-1', title: 'Deal One' }),
        createMockDeal({ id: 'deal-2', title: 'Deal Two' }),
      ];

      render(
        <TaskQuickAdd
          deals={deals}
          onAdd={mockOnAdd}
        />
      );

      await user.click(screen.getByText('Choisir un deal'));
      await user.click(screen.getByText('Deal One'));

      // Deal picker should close and show selected deal
      expect(screen.getByText('Deal One')).toBeInTheDocument();
      expect(screen.queryByText('Deal Two')).not.toBeInTheDocument();
    });
  });

  describe('date selection', () => {
    it('opens date picker on click', async () => {
      const user = userEvent.setup();

      render(
        <TaskQuickAdd
          deals={[createMockDeal()]}
          onAdd={mockOnAdd}
        />
      );

      await user.click(screen.getByText('Demain'));

      expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
      expect(screen.getByText('Dans 3 jours')).toBeInTheDocument();
      expect(screen.getByText('Dans 1 semaine')).toBeInTheDocument();
    });

    it('selects date when clicked', async () => {
      const user = userEvent.setup();

      render(
        <TaskQuickAdd
          deals={[createMockDeal()]}
          onAdd={mockOnAdd}
        />
      );

      await user.click(screen.getByText('Demain'));
      await user.click(screen.getByText("Aujourd'hui"));

      // Date picker should close and show selected date
      await waitFor(() => {
        expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('calls onAdd with correct data when form is submitted', async () => {
      const user = userEvent.setup();
      const deal = createMockDeal({ id: 'deal-1', title: 'Test Deal' });

      render(
        <TaskQuickAdd
          deals={[deal]}
          onAdd={mockOnAdd}
          defaultDealId="deal-1"
        />
      );

      await user.type(screen.getByPlaceholderText('Nouvelle tâche...'), 'New task title');
      await user.click(screen.getByRole('button', { name: '' })); // Submit button with Plus icon

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          dealId: 'deal-1',
          title: 'New task title',
          source: 'manual',
        })
      );
    });

    it('submits form on Enter key', async () => {
      const user = userEvent.setup();
      const deal = createMockDeal({ id: 'deal-1' });

      render(
        <TaskQuickAdd
          deals={[deal]}
          onAdd={mockOnAdd}
          defaultDealId="deal-1"
        />
      );

      const input = screen.getByPlaceholderText('Nouvelle tâche...');
      await user.type(input, 'New task{enter}');

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New task',
        })
      );
    });

    it('does not submit when title is empty', async () => {
      const user = userEvent.setup();
      const deal = createMockDeal({ id: 'deal-1' });

      render(
        <TaskQuickAdd
          deals={[deal]}
          onAdd={mockOnAdd}
          defaultDealId="deal-1"
        />
      );

      const submitButton = screen.getByRole('button', { name: '' });
      await user.click(submitButton);

      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('does not submit when deal is not selected', async () => {
      const user = userEvent.setup();

      render(
        <TaskQuickAdd
          deals={[createMockDeal()]}
          onAdd={mockOnAdd}
        />
      );

      await user.type(screen.getByPlaceholderText('Nouvelle tâche...'), 'New task');

      const submitButton = screen.getByRole('button', { name: '' });
      expect(submitButton).toBeDisabled();
    });

    it('shows validation hint when title is entered but no deal selected', async () => {
      const user = userEvent.setup();

      render(
        <TaskQuickAdd
          deals={[createMockDeal()]}
          onAdd={mockOnAdd}
        />
      );

      await user.type(screen.getByPlaceholderText('Nouvelle tâche...'), 'New task');

      expect(screen.getByText('Sélectionnez un deal pour ajouter la tâche')).toBeInTheDocument();
    });

    it('clears form after successful submission', async () => {
      const user = userEvent.setup();
      const deal = createMockDeal({ id: 'deal-1' });

      render(
        <TaskQuickAdd
          deals={[deal]}
          onAdd={mockOnAdd}
          defaultDealId="deal-1"
        />
      );

      const input = screen.getByPlaceholderText('Nouvelle tâche...');
      await user.type(input, 'New task{enter}');

      expect(input).toHaveValue('');
    });
  });
});
