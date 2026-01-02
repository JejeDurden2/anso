import { Card } from '@anso/ui';
import { TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';
import type { MonthlyRevenue } from '@/services/dashboard';

interface RevenueTrendProps {
  data: MonthlyRevenue[];
  isLoading?: boolean;
}

// Minimum Y-axis scale to prevent chart distortion
const MIN_Y_SCALE = 1000;

// Chart dimensions
const CHART_HEIGHT = 160;
const CHART_WIDTH = 100;
const PADDING = 10;

export function RevenueTrend({ data, isLoading }: RevenueTrendProps): JSX.Element {
  // Check if there's any revenue data
  const hasData = useMemo(() => data.some((d) => d.revenue > 0), [data]);

  // Calculate Y-axis max with minimum scale to prevent distortion
  const yAxisMax = useMemo(() => {
    const dataMax = Math.max(...data.map((d) => d.revenue), 0);
    // Use at least MIN_Y_SCALE, or 10% above dataMax
    return Math.max(dataMax * 1.1, MIN_Y_SCALE);
  }, [data]);

  const totalRevenue = useMemo(
    () => data.reduce((sum, d) => sum + d.revenue, 0),
    [data]
  );

  // Format currency for tooltips (compact)
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

  // Format currency for display (full)
  const formatFullCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Loading state
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

  // Empty state when no revenue data
  if (!hasData) {
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
            <p className="text-2xl font-bold text-slate-900">0 €</p>
            <p className="text-xs text-slate-500">Total période</p>
          </div>
        </div>

        {/* Empty state illustration */}
        <div className="relative mt-6">
          {/* Dashed baseline showing where data will appear */}
          <div className="relative h-40 sm:h-48">
            {/* Grid lines (faded) */}
            <div className="absolute inset-x-0 bottom-0 flex h-full flex-col justify-between opacity-30">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="border-t border-dashed border-slate-200"
                />
              ))}
            </div>

            {/* Centered empty message */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <TrendingUp className="h-6 w-6 text-slate-400" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-600">
                Aucun CA enregistré
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Les données apparaîtront ici
              </p>
            </div>

            {/* Dashed placeholder line at bottom */}
            <svg
              viewBox={`0 0 ${CHART_WIDTH} 20`}
              className="absolute bottom-0 h-5 w-full"
              preserveAspectRatio="none"
            >
              <line
                x1={PADDING}
                y1="10"
                x2={CHART_WIDTH - PADDING}
                y2="10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="text-slate-300"
              />
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="mt-2 flex justify-between px-2">
            {data.map((d, i) => (
              <span key={i} className="text-xs text-slate-400">
                {d.month}
              </span>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Calculate points for chart with proper scaling
  const points = data.map((d, i) => {
    const x = data.length > 1
      ? (i / (data.length - 1)) * (CHART_WIDTH - PADDING * 2) + PADDING
      : CHART_WIDTH / 2;
    const y =
      CHART_HEIGHT -
      PADDING -
      (d.revenue / yAxisMax) * (CHART_HEIGHT - PADDING * 2);
    return { x, y, revenue: d.revenue, month: d.month };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${CHART_HEIGHT - PADDING} L ${PADDING} ${CHART_HEIGHT - PADDING} Z`;

  // Y-axis scale labels
  const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map((percent) => ({
    value: yAxisMax * percent,
    y: CHART_HEIGHT - PADDING - percent * (CHART_HEIGHT - PADDING * 2),
  }));

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
        {/* Y-axis labels */}
        <div className="absolute -left-1 top-0 hidden h-40 flex-col justify-between text-right sm:flex sm:h-48">
          {yAxisLabels.reverse().map((label, i) => (
            <span key={i} className="text-[10px] text-slate-400">
              {formatCurrency(label.value)}
            </span>
          ))}
        </div>

        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-40 w-full sm:h-48"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <line
              key={percent}
              x1={PADDING}
              y1={CHART_HEIGHT - PADDING - (percent / 100) * (CHART_HEIGHT - PADDING * 2)}
              x2={CHART_WIDTH - PADDING}
              y2={CHART_HEIGHT - PADDING - (percent / 100) * (CHART_HEIGHT - PADDING * 2)}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-slate-100"
            />
          ))}

          {/* Area under line */}
          <path d={areaPath} className="fill-brand-100/50" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-500"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data points - consistent size with vectorEffect */}
          {points.map((point, i) => (
            <g key={i} className="group">
              {/* Larger invisible circle for hover */}
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                className="cursor-pointer fill-transparent"
                vectorEffect="non-scaling-stroke"
              />
              {/* Visible point - fixed size that doesn't distort */}
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill="white"
                stroke="currentColor"
                strokeWidth="2"
                className="text-brand-500 transition-all group-hover:r-4"
                vectorEffect="non-scaling-stroke"
              />
              {/* Tooltip */}
              <g
                className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100"
              >
                <rect
                  x={point.x - 20}
                  y={point.y - 30}
                  width="40"
                  height="18"
                  rx="3"
                  className="fill-slate-900"
                />
                <text
                  x={point.x}
                  y={point.y - 17}
                  textAnchor="middle"
                  className="fill-white text-[7px] font-medium"
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
