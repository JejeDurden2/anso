import { Card, Button } from '@anso/ui';
import { AlertTriangle, Phone, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';
import type { StaleDeal } from '@/services/dashboard';

interface StaleDealsTableProps {
  deals: StaleDeal[];
  isLoading?: boolean;
}

// Format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

// Format date
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export function StaleDealsTable({
  deals,
  isLoading,
}: StaleDealsTableProps): JSX.Element {
  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 flex-1 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (deals.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
          Deals en attente
        </h3>
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Clock className="h-6 w-6 text-green-600" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-900">
            Tout est à jour !
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Aucun deal n'attend de suivi
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
          Deals en attente
        </h3>
        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          {deals.length}
        </span>
      </div>

      <p className="mt-1 text-sm text-slate-500">
        Opportunités sans activité depuis 7+ jours
      </p>

      <div className="mt-4 space-y-2">
        {deals.slice(0, 5).map((deal) => (
          <div
            key={deal.id}
            className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            {/* Stage indicator */}
            <div
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: deal.stageColor }}
            />

            {/* Deal info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  to={`/app/deals`}
                  className="truncate font-medium text-slate-900 hover:text-brand-600"
                >
                  {deal.title}
                </Link>
                {deal.value !== null && deal.value > 0 && (
                  <span className="flex-shrink-0 text-sm text-slate-500">
                    {formatCurrency(deal.value)}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                {deal.contactName && (
                  <>
                    <span className="truncate">{deal.contactName}</span>
                    <span className="text-slate-300">&bull;</span>
                  </>
                )}
                <span className={cn(
                  deal.daysSinceActivity > 14 ? 'text-red-500' : 'text-amber-500'
                )}>
                  {deal.daysSinceActivity} jours
                </span>
                <span className="text-slate-400">
                  (dernier contact: {formatDate(deal.lastActivityAt)})
                </span>
              </div>
            </div>

            {/* Action button */}
            <Button
              size="sm"
              variant="outline"
              className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Phone className="mr-1.5 h-3.5 w-3.5" />
              Relancer
            </Button>
          </div>
        ))}
      </div>

      {deals.length > 5 && (
        <p className="mt-3 text-center text-sm text-slate-500">
          Et {deals.length - 5} autre{deals.length - 5 > 1 ? 's' : ''} deal{deals.length - 5 > 1 ? 's' : ''}...
        </p>
      )}
    </Card>
  );
}
