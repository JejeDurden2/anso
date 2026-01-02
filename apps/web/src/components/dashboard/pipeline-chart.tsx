import { Card } from '@anso/ui';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';
import type { StageMetrics } from '@/services/dashboard';

interface PipelineChartProps {
  data: StageMetrics[];
  isLoading?: boolean;
}

export function PipelineChart({ data, isLoading }: PipelineChartProps): JSX.Element {
  // Find max deal count for scaling bars
  const maxCount = useMemo(
    () => Math.max(...data.map((d) => d.dealCount), 1),
    [data]
  );

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-8 flex-1 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
        Pipeline par étape
      </h3>

      <div className="mt-6 space-y-4">
        {data.map((stage) => {
          const percentage = (stage.dealCount / maxCount) * 100;

          return (
            <div key={stage.stageId} className="group">
              {/* Stage name and count */}
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: stage.stageColor }}
                  />
                  <span className="font-medium text-slate-700">
                    {stage.stageName}
                  </span>
                </div>
                <span className="text-slate-500">
                  {stage.dealCount} deal{stage.dealCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Bar */}
              <div className="relative h-8 overflow-hidden rounded-lg bg-slate-100">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 flex items-center rounded-lg transition-all duration-500',
                    'group-hover:opacity-90'
                  )}
                  style={{
                    width: `${Math.max(percentage, 2)}%`,
                    backgroundColor: stage.stageColor,
                  }}
                >
                  {/* Show value on hover */}
                  <span
                    className={cn(
                      'ml-3 text-sm font-medium transition-opacity',
                      percentage > 20 ? 'text-white' : 'text-slate-700',
                      stage.totalValue > 0 ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                    )}
                  >
                    {formatCurrency(stage.totalValue)}
                  </span>
                </div>

                {/* Value label for narrow bars */}
                {percentage <= 20 && stage.totalValue > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                    {formatCurrency(stage.totalValue)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-sm font-medium text-slate-600">Total pipeline</span>
        <span className="text-lg font-bold text-slate-900">
          {formatCurrency(data.reduce((sum, d) => sum + d.totalValue, 0))}
        </span>
      </div>
    </Card>
  );
}
