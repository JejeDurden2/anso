import { Card } from '@anso/ui';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';
import type { MonthlyRevenue } from '@/services/dashboard';

interface RevenueTrendProps {
  data: MonthlyRevenue[];
  isLoading?: boolean;
}

export function RevenueTrend({ data, isLoading }: RevenueTrendProps): JSX.Element {
  // Calculate chart dimensions
  const maxRevenue = useMemo(
    () => Math.max(...data.map((d) => d.revenue), 1),
    [data]
  );

  const totalRevenue = useMemo(
    () => data.reduce((sum, d) => sum + d.revenue, 0),
    [data]
  );

  // Format currency
  const formatCurrency = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k €`;
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatFullCurrency = (value: number): string => {
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
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="mt-6 flex h-48 items-end gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-slate-200"
                style={{ height: `${20 + i * 10}%` }}
              />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Generate SVG path for line chart
  const chartHeight = 160;
  const chartWidth = 100; // percentage
  const padding = 10;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (chartWidth - padding * 2) + padding;
    const y =
      chartHeight -
      padding -
      (d.revenue / maxRevenue) * (chartHeight - padding * 2);
    return { x, y, revenue: d.revenue, month: d.month };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`;

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
            Évolution du CA
          </h3>
          <p className="mt-1 text-sm text-slate-500">6 derniers mois</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">
            {formatFullCurrency(totalRevenue)}
          </p>
          <p className="text-xs text-slate-500">Total période</p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative mt-6">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-40 w-full overflow-visible sm:h-48"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <line
              key={percent}
              x1={padding}
              y1={chartHeight - padding - (percent / 100) * (chartHeight - padding * 2)}
              x2={chartWidth - padding}
              y2={chartHeight - padding - (percent / 100) * (chartHeight - padding * 2)}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-slate-100"
            />
          ))}

          {/* Area under line */}
          <path
            d={areaPath}
            className="fill-brand-100/50"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-500"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <g key={i} className="group">
              {/* Larger invisible circle for hover */}
              <circle
                cx={point.x}
                cy={point.y}
                r="8"
                className="cursor-pointer fill-transparent"
              />
              {/* Visible point */}
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                className="fill-white stroke-brand-500 stroke-2 transition-all group-hover:r-5"
              />
              {/* Tooltip */}
              <g
                className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100"
                transform={`translate(${point.x}, ${point.y - 12})`}
              >
                <rect
                  x="-25"
                  y="-22"
                  width="50"
                  height="20"
                  rx="4"
                  className="fill-slate-900"
                />
                <text
                  textAnchor="middle"
                  y="-8"
                  className="fill-white text-[8px] font-medium"
                >
                  {formatCurrency(point.revenue)}
                </text>
              </g>
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="mt-2 flex justify-between px-2">
          {data.map((d, i) => (
            <span
              key={i}
              className={cn(
                'text-xs text-slate-500',
                i === data.length - 1 && 'font-medium text-slate-700'
              )}
            >
              {d.month}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
