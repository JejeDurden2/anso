import type {
  AutomationRule,
  DealStaleTriggerConfig,
  DealStageChangedTriggerConfig,
  DealCreatedTriggerConfig,
} from '@anso/types';
import { Card, Switch } from '@anso/ui';
import { Zap, Clock, ArrowRight, Plus, Pencil, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface AutomationRuleCardProps {
  rule: AutomationRule;
  stageName?: (stageId: string) => string;
  onToggle: (enabled: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isToggling?: boolean;
}

// Get trigger description in French
function getTriggerDescription(
  rule: AutomationRule,
  stageName?: (stageId: string) => string
): string {
  switch (rule.trigger.type) {
    case 'deal_stale': {
      const config = rule.trigger.config as DealStaleTriggerConfig;
      return `Quand un deal est inactif depuis ${config.staleDays} jour${config.staleDays > 1 ? 's' : ''}`;
    }
    case 'deal_stage_changed': {
      const config = rule.trigger.config as DealStageChangedTriggerConfig;
      const toStage = stageName?.(config.toStageId) ?? 'une étape';
      if (config.fromStageId) {
        const fromStage = stageName?.(config.fromStageId) ?? 'une étape';
        return `Quand un deal passe de "${fromStage}" à "${toStage}"`;
      }
      return `Quand un deal entre dans "${toStage}"`;
    }
    case 'deal_created': {
      const config = rule.trigger.config as DealCreatedTriggerConfig;
      if (config.stageId) {
        const stage = stageName?.(config.stageId) ?? 'une étape';
        return `Quand un deal est créé dans "${stage}"`;
      }
      return 'Quand un nouveau deal est créé';
    }
    default:
      return 'Déclencheur inconnu';
  }
}

// Get trigger icon
function getTriggerIcon(type: string): JSX.Element {
  switch (type) {
    case 'deal_stale':
      return <Clock className="h-4 w-4" />;
    case 'deal_stage_changed':
      return <ArrowRight className="h-4 w-4" />;
    case 'deal_created':
      return <Plus className="h-4 w-4" />;
    default:
      return <Zap className="h-4 w-4" />;
  }
}

// Get action description in French
function getActionDescription(rule: AutomationRule): string {
  if (rule.action.type === 'create_task') {
    return `Créer la tâche "${rule.action.config.taskTitle}" (échéance dans ${rule.action.config.dueDaysFromNow} jour${rule.action.config.dueDaysFromNow > 1 ? 's' : ''})`;
  }
  return 'Action inconnue';
}

export function AutomationRuleCard({
  rule,
  stageName,
  onToggle,
  onEdit,
  onDelete,
  isToggling,
}: AutomationRuleCardProps): JSX.Element {
  return (
    <Card
      className={cn(
        'p-4 transition-all',
        rule.enabled
          ? 'ring-1 ring-brand-200 bg-white'
          : 'opacity-60 hover:opacity-80'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
              rule.enabled
                ? 'bg-brand-100 text-brand-600'
                : 'bg-slate-100 text-slate-400'
            )}
          >
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3
              className={cn(
                'font-semibold',
                rule.enabled ? 'text-slate-900' : 'text-slate-500'
              )}
            >
              {rule.name}
            </h3>
            {rule.description && (
              <p className="mt-0.5 text-sm text-slate-500">{rule.description}</p>
            )}
          </div>
        </div>

        <Switch
          checked={rule.enabled}
          onCheckedChange={onToggle}
          disabled={isToggling}
        />
      </div>

      {/* Trigger & Action details */}
      <div className="mt-4 space-y-2">
        {/* Trigger */}
        <div className="flex items-start gap-2 text-sm">
          <div
            className={cn(
              'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded',
              rule.enabled
                ? 'bg-amber-100 text-amber-600'
                : 'bg-slate-100 text-slate-400'
            )}
          >
            {getTriggerIcon(rule.trigger.type)}
          </div>
          <span className={rule.enabled ? 'text-slate-700' : 'text-slate-500'}>
            {getTriggerDescription(rule, stageName)}
          </span>
        </div>

        {/* Arrow */}
        <div className="flex items-center gap-2 pl-2">
          <div className="h-4 w-px bg-slate-200" />
        </div>

        {/* Action */}
        <div className="flex items-start gap-2 text-sm">
          <div
            className={cn(
              'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded',
              rule.enabled
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-slate-100 text-slate-400'
            )}
          >
            <Plus className="h-4 w-4" />
          </div>
          <span className={rule.enabled ? 'text-slate-700' : 'text-slate-500'}>
            {getActionDescription(rule)}
          </span>
        </div>
      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600"
            >
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
