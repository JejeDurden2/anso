import { useMemo } from 'react';

import { useDeals, type DealWithRelations } from './deals';
import { useStages } from './stages';

// Activity types for the dashboard
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'deal_created' | 'deal_moved';

export interface Activity {
  id: string;
  type: ActivityType;
  dealId: string;
  dealTitle: string;
  contactName: string | null;
  description: string;
  createdAt: Date;
}

export interface PipelineMetrics {
  totalValue: number;
  activeDeals: number;
  conversionRate: number;
  monthlyRevenue: number;
  previousMonthRevenue: number;
  previousTotalValue: number;
  previousActiveDeals: number;
  previousConversionRate: number;
}

export interface StageMetrics {
  stageId: string;
  stageName: string;
  stageColor: string;
  dealCount: number;
  totalValue: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface StaleDeal {
  id: string;
  title: string;
  value: number | null;
  contactName: string | null;
  stageName: string;
  stageColor: string;
  lastActivityAt: Date;
  daysSinceActivity: number;
}

// Helper to get start of month
function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Helper to get start of previous month
function getStartOfPreviousMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

// Helper to check if deal is "won" based on stage name
function isWonStage(stageName: string): boolean {
  const name = stageName.toLowerCase();
  return name.includes('gagn') || name.includes('won') || name.includes('conclu');
}

// Helper to check if deal is "lost" based on stage name
function isLostStage(stageName: string): boolean {
  const name = stageName.toLowerCase();
  return name.includes('perdu') || name.includes('lost') || name.includes('abandonn');
}

// Helper to check if deal is closed (won or lost)
function isClosedStage(stageName: string): boolean {
  return isWonStage(stageName) || isLostStage(stageName);
}

// Calculate pipeline metrics from deals
function calculateMetrics(
  deals: DealWithRelations[],
  currentMonth: Date
): PipelineMetrics {
  const startOfCurrentMonth = getStartOfMonth(currentMonth);
  const startOfPreviousMonth = getStartOfPreviousMonth(currentMonth);

  // Filter deals by period
  const currentMonthDeals = deals.filter(
    (d) => new Date(d.createdAt) >= startOfCurrentMonth
  );
  const previousMonthDeals = deals.filter(
    (d) =>
      new Date(d.createdAt) >= startOfPreviousMonth &&
      new Date(d.createdAt) < startOfCurrentMonth
  );

  // Active deals (not closed)
  const activeDeals = deals.filter((d) => !isClosedStage(d.stage.name));
  const previousActiveDeals = previousMonthDeals.filter(
    (d) => !isClosedStage(d.stage.name)
  );

  // Total pipeline value (active deals only)
  const totalValue = activeDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const previousTotalValue = previousActiveDeals.reduce(
    (sum, d) => sum + (d.value || 0),
    0
  );

  // Won deals this month
  const wonDealsThisMonth = currentMonthDeals.filter((d) =>
    isWonStage(d.stage.name)
  );
  const wonDealsPreviousMonth = previousMonthDeals.filter((d) =>
    isWonStage(d.stage.name)
  );

  // Monthly revenue
  const monthlyRevenue = wonDealsThisMonth.reduce(
    (sum, d) => sum + (d.value || 0),
    0
  );
  const previousMonthRevenue = wonDealsPreviousMonth.reduce(
    (sum, d) => sum + (d.value || 0),
    0
  );

  // Conversion rate (won / total closed)
  const closedDeals = deals.filter((d) => isClosedStage(d.stage.name));
  const wonDeals = deals.filter((d) => isWonStage(d.stage.name));
  const conversionRate =
    closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0;

  // Previous period conversion rate
  const previousClosedDeals = previousMonthDeals.filter((d) =>
    isClosedStage(d.stage.name)
  );
  const previousWonDeals = previousMonthDeals.filter((d) =>
    isWonStage(d.stage.name)
  );
  const previousConversionRate =
    previousClosedDeals.length > 0
      ? (previousWonDeals.length / previousClosedDeals.length) * 100
      : 0;

  return {
    totalValue,
    activeDeals: activeDeals.length,
    conversionRate,
    monthlyRevenue,
    previousMonthRevenue,
    previousTotalValue,
    previousActiveDeals: previousActiveDeals.length,
    previousConversionRate,
  };
}

// Calculate metrics by stage
function calculateStageMetrics(
  deals: DealWithRelations[],
  stages: { id: string; name: string; color: string; position: number }[]
): StageMetrics[] {
  return stages
    .sort((a, b) => a.position - b.position)
    .map((stage) => {
      const stageDeals = deals.filter((d) => d.stageId === stage.id);
      return {
        stageId: stage.id,
        stageName: stage.name,
        stageColor: stage.color,
        dealCount: stageDeals.length,
        totalValue: stageDeals.reduce((sum, d) => sum + (d.value || 0), 0),
      };
    });
}

// Calculate revenue trend (last 6 months)
function calculateRevenueTrend(deals: DealWithRelations[]): MonthlyRevenue[] {
  const now = new Date();
  const months: MonthlyRevenue[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const monthName = monthStart.toLocaleDateString('fr-FR', { month: 'short' });

    const monthRevenue = deals
      .filter((d) => {
        const dealDate = new Date(d.updatedAt);
        return (
          isWonStage(d.stage.name) &&
          dealDate >= monthStart &&
          dealDate <= monthEnd
        );
      })
      .reduce((sum, d) => sum + (d.value || 0), 0);

    months.push({
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      revenue: monthRevenue,
    });
  }

  return months;
}

// Get stale deals (no activity for 7+ days)
function getStaleDelas(deals: DealWithRelations[]): StaleDeal[] {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return deals
    .filter((d) => {
      // Only active deals (not closed)
      if (isClosedStage(d.stage.name)) return false;
      // Check if last activity (updatedAt) is older than 7 days
      return new Date(d.updatedAt) < sevenDaysAgo;
    })
    .map((d) => {
      const lastActivity = new Date(d.updatedAt);
      const daysSince = Math.floor(
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: d.id,
        title: d.title,
        value: d.value,
        contactName: d.contact?.name || null,
        stageName: d.stage.name,
        stageColor: d.stage.color,
        lastActivityAt: lastActivity,
        daysSinceActivity: daysSince,
      };
    })
    .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);
}

// Generate mock activities from deals
function generateActivities(deals: DealWithRelations[]): Activity[] {
  const activities: Activity[] = [];

  // Generate activities from recent deals
  const recentDeals = [...deals]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 10);

  recentDeals.forEach((deal, index) => {
    // Mix of activity types
    const types: ActivityType[] = [
      'deal_created',
      'call',
      'email',
      'meeting',
      'note',
      'deal_moved',
    ];
    const type = types[index % types.length];

    const descriptions: Record<ActivityType, string> = {
      deal_created: `Nouvelle opportunité créée`,
      call: `Appel avec le contact`,
      email: `Email envoyé`,
      meeting: `Réunion planifiée`,
      note: `Note ajoutée`,
      deal_moved: `Déplacé vers ${deal.stage.name}`,
    };

    activities.push({
      id: `activity-${deal.id}-${index}`,
      type,
      dealId: deal.id,
      dealTitle: deal.title,
      contactName: deal.contact?.name || null,
      description: descriptions[type],
      createdAt: new Date(deal.updatedAt),
    });
  });

  return activities.slice(0, 5);
}

// Main dashboard hook
export function useDashboardData(workspaceId: string) {
  const { data: deals = [], isLoading: isDealsLoading } = useDeals(workspaceId);
  const { data: stages = [], isLoading: isStagesLoading } = useStages(workspaceId);

  const metrics = useMemo(
    () => calculateMetrics(deals, new Date()),
    [deals]
  );

  const stageMetrics = useMemo(
    () => calculateStageMetrics(deals, stages),
    [deals, stages]
  );

  const revenueTrend = useMemo(
    () => calculateRevenueTrend(deals),
    [deals]
  );

  const staleDeals = useMemo(() => getStaleDelas(deals), [deals]);

  const activities = useMemo(() => generateActivities(deals), [deals]);

  return {
    metrics,
    stageMetrics,
    revenueTrend,
    staleDeals,
    activities,
    isLoading: isDealsLoading || isStagesLoading,
  };
}
