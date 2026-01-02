import { Card } from '@anso/ui';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  iconColor?: string;
  iconBgColor?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel = 'vs mois dernier',
  iconColor = 'text-brand-600',
  iconBgColor = 'bg-brand-100',
}: MetricCardProps): JSX.Element {
  const hasTrend = trend !== undefined && !isNaN(trend);
  const isPositive = hasTrend && trend > 0;
  const isNegative = hasTrend && trend < 0;
  const isNeutral = hasTrend && trend === 0;

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {value}
          </p>
          {hasTrend && (
            <div className="mt-2 flex items-center gap-1.5">
              {isPositive && (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    +{trend.toFixed(0)}%
                  </span>
                </>
              )}
              {isNegative && (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">
                    {trend.toFixed(0)}%
                  </span>
                </>
              )}
              {isNeutral && (
                <>
                  <Minus className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-500">0%</span>
                </>
              )}
              <span className="text-xs text-slate-400">{trendLabel}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12',
            iconBgColor
          )}
        >
          <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', iconColor)} />
        </div>
      </div>
    </Card>
  );
}
