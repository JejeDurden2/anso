import { Button, Card } from '@anso/ui';
import { Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';


import { DealModal } from '@/components/deals/deal-modal';
import { KanbanBoard } from '@/components/deals/kanban-board';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import { useDeals, useCreateDeal, type DealWithRelations } from '@/services/deals';
import { useStages } from '@/services/stages';

export function DealsPage(): JSX.Element {
  const { workspaceId, isLoading: isWorkspaceLoading } = useCurrentWorkspace();

  const { data: stages = [], isLoading: isStagesLoading } = useStages(workspaceId);
  const { data: deals = [], isLoading: isDealsLoading } = useDeals(workspaceId);
  const createDealMutation = useCreateDeal(workspaceId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealWithRelations | undefined>();
  const [defaultStageId, setDefaultStageId] = useState<string | undefined>();

  const isLoading = isWorkspaceLoading || isStagesLoading || isDealsLoading;

  const handleDealClick = (deal: DealWithRelations): void => {
    setSelectedDeal(deal);
    setDefaultStageId(undefined);
    setIsModalOpen(true);
  };

  const handleNewDeal = (stageId?: string): void => {
    setSelectedDeal(undefined);
    setDefaultStageId(stageId);
    setIsModalOpen(true);
  };

  const handleQuickAdd = async (title: string, stageId: string): Promise<void> => {
    await createDealMutation.mutateAsync({ title, stageId });
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setSelectedDeal(undefined);
    setDefaultStageId(undefined);
  };

  // Calculate totals
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <Card className="max-w-md p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <Plus className="h-6 w-6 text-brand-600" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Aucune étape configurée</h2>
          <p className="mt-2 text-slate-600">
            Les étapes du pipeline seront créées automatiquement avec votre premier workspace.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
          <div className="mt-1 flex items-center gap-4 text-sm text-slate-600">
            <span>
              {totalDeals} opportunité{totalDeals !== 1 ? 's' : ''}
            </span>
            {totalValue > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-brand-600">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  }).format(totalValue)}
                </span>
              </>
            )}
          </div>
        </div>
        <Button onClick={() => handleNewDeal()}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle opportunité
        </Button>
      </div>

      {/* Kanban board */}
      <div className="mt-6 flex-1 overflow-hidden">
        <KanbanBoard
          workspaceId={workspaceId}
          stages={stages}
          deals={deals}
          onDealClick={handleDealClick}
          onQuickAdd={handleQuickAdd}
        />
      </div>

      {/* Deal Modal */}
      <DealModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        workspaceId={workspaceId}
        stages={stages}
        deal={selectedDeal}
        defaultStageId={defaultStageId}
      />
    </div>
  );
}
