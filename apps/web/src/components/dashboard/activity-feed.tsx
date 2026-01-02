import { Card } from '@anso/ui';
import {
  Phone,
  Mail,
  Calendar,
  StickyNote,
  Plus,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Activity, ActivityType } from '@/services/dashboard';

interface ActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
}

const activityConfig: Record<
  ActivityType,
  { icon: LucideIcon; color: string; bgColor: string }
> = {
  call: {
    icon: Phone,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  email: {
    icon: Mail,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  meeting: {
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  note: {
    icon: StickyNote,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  deal_created: {
    icon: Plus,
    color: 'text-brand-600',
    bgColor: 'bg-brand-100',
  },
  deal_moved: {
    icon: ArrowRight,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
};

// Format relative time in French
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;

  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export function ActivityFeed({
  activities,
  isLoading,
}: ActivityFeedProps): JSX.Element {
  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                </div>
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
        Activité récente
      </h3>

      {activities.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Calendar className="h-6 w-6 text-slate-400" />
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Aucune activité récente
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-1">
          {activities.map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;
            const isLast = index === activities.length - 1;

            return (
              <div key={activity.id} className="relative flex gap-3 py-3">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute bottom-0 left-[18px] top-12 w-px bg-slate-200" />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    'relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
                    config.bgColor
                  )}
                >
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">{activity.dealTitle}</span>
                    <span className="text-slate-500">
                      {' '}&mdash; {activity.description}
                    </span>
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    {activity.contactName && (
                      <>
                        <span>{activity.contactName}</span>
                        <span className="text-slate-300">&bull;</span>
                      </>
                    )}
                    <span>{formatRelativeTime(activity.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
