import type { Stage } from '@anso/types';
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
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';

import { cn } from '@/lib/utils';
import { useMoveDeal, type DealWithRelations } from '@/services/deals';

import { DealCardOverlay } from './deal-card';
import { KanbanColumn } from './kanban-column';

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
  const [isDragScrolling, setIsDragScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; scrollLeft: number } | null>(null);
  const moveDeal = useMoveDeal(workspaceId);

  // Horizontal scroll with mouse wheel
  const handleWheel = useCallback((e: WheelEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Only handle horizontal scroll when not scrolling vertically
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaX === 0) {
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    }
  }, []);

  // Drag to scroll functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only activate on middle click or when holding shift
    if (e.button !== 1 && !e.shiftKey) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    e.preventDefault();
    setIsDragScrolling(true);
    dragStartRef.current = {
      x: e.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft,
    };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragScrolling || !dragStartRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragStartRef.current.x) * 1.5; // Scroll speed multiplier
    container.scrollLeft = dragStartRef.current.scrollLeft - walk;
  }, [isDragScrolling]);

  const handleMouseUp = useCallback(() => {
    setIsDragScrolling(false);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  useEffect(() => {
    if (isDragScrolling) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragScrolling, handleMouseMove, handleMouseUp]);

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
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        className={cn(
          // Base layout
          'flex h-full gap-4 overflow-x-auto pb-4',
          // Hide scrollbar visually but keep functionality
          'scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]',
          // Scroll snap on mobile
          'snap-x snap-mandatory sm:snap-none',
          // Smooth scrolling
          'scroll-smooth',
          // Cursor states for drag-to-scroll
          isDragScrolling ? 'cursor-grabbing select-none' : ''
        )}
      >
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
