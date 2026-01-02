import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import type { Stage } from '@anso/types';

import { KanbanColumn } from './kanban-column';
import { DealCardOverlay } from './deal-card';
import { useMoveDeal, type DealWithRelations } from '@/services/deals';

interface KanbanBoardProps {
  workspaceId: string;
  stages: Stage[];
  deals: DealWithRelations[];
  onDealClick: (deal: DealWithRelations) => void;
  onQuickAdd: (title: string, stageId: string) => void;
}

export function KanbanBoard({
  workspaceId,
  stages,
  deals,
  onDealClick,
  onQuickAdd,
}: KanbanBoardProps): JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(null);
  const moveDeal = useMoveDeal(workspaceId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const grouped = new Map<string, DealWithRelations[]>();
    stages.forEach((stage) => {
      grouped.set(stage.id, []);
    });
    deals.forEach((deal) => {
      const stageDeals = grouped.get(deal.stageId);
      if (stageDeals) {
        stageDeals.push(deal);
      }
    });
    return grouped;
  }, [stages, deals]);

  const activeDeal = useMemo(
    () => deals.find((d) => d.id === activeId),
    [deals, activeId]
  );

  const handleDragStart = (event: DragStartEvent): void => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (_event: DragOverEvent): void => {
    // We could implement real-time position preview here if needed
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== 'deal') return;

    const activeDeal = activeData.deal as DealWithRelations;
    let newStageId: string | null = null;

    // Dropped on a column
    if (overData?.type === 'stage') {
      newStageId = (overData.stage as Stage).id;
    }
    // Dropped on another deal - get that deal's stage
    else if (overData?.type === 'deal') {
      newStageId = (overData.deal as DealWithRelations).stageId;
    }
    // Dropped on a column container (fallback)
    else if (typeof over.id === 'string' && stages.some((s) => s.id === over.id)) {
      newStageId = over.id;
    }

    // Only move if stage changed
    if (newStageId && newStageId !== activeDeal.stageId) {
      moveDeal.mutate({ dealId: activeDeal.id, stageId: newStageId });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={dealsByStage.get(stage.id) || []}
            onDealClick={onDealClick}
            onQuickAdd={onQuickAdd}
            activeId={activeId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDeal ? <DealCardOverlay deal={activeDeal} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
