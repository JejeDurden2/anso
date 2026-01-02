import { Loader2, DollarSign, Target, TrendingUp, Percent } from 'lucide-react';

import {
  MetricCard,
  PipelineChart,
  RevenueTrend,
  ActivityFeed,
  StaleDealsTable,
} from '@/components/dashboard';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import { useDashboardData } from '@/services/dashboard';

// Format currency
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M €`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k €`;
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

// Calculate percentage change
function calculateChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

export function DashboardPage(): JSX.Element {
  const { workspaceId, isLoading: isWorkspaceLoading } = useCurrentWorkspace();

  const {
    metrics,
    stageMetrics,
    revenueTrend,
    staleDeals,
    activities,
    isLoading: isDataLoading,
  } = useDashboardData(workspaceId);

  const isLoading = isWorkspaceLoading || isDataLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Vue d'ensemble de votre activité commerciale
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Pipeline total"
          value={formatCurrency(metrics.totalValue)}
          icon={DollarSign}
          trend={calculateChange(metrics.totalValue, metrics.previousTotalValue)}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-100"
        />
        <MetricCard
          title="Deals actifs"
          value={metrics.activeDeals.toString()}
          icon={Target}
          trend={calculateChange(metrics.activeDeals, metrics.previousActiveDeals)}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <MetricCard
          title="Taux de conversion"
          value={`${metrics.conversionRate.toFixed(0)}%`}
          icon={Percent}
          trend={calculateChange(
            metrics.conversionRate,
            metrics.previousConversionRate
          )}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <MetricCard
          title="CA du mois"
          value={formatCurrency(metrics.monthlyRevenue)}
          icon={TrendingUp}
          trend={calculateChange(
            metrics.monthlyRevenue,
            metrics.previousMonthRevenue
          )}
          iconColor="text-brand-600"
          iconBgColor="bg-brand-100"
        />
      </div>

      {/* Charts Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PipelineChart data={stageMetrics} />
        <RevenueTrend data={revenueTrend} />
      </div>

      {/* Activity & Stale Deals Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ActivityFeed activities={activities} />
        <StaleDealsTable deals={staleDeals} />
      </div>
    </div>
  );
}
