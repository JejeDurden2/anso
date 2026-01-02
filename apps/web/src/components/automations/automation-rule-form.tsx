import type {
  AutomationRule,
  CreateAutomationRuleInput,
  AutomationTriggerType,
  Stage,
} from '@anso/types';
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Button,
  Input,
  Label,
} from '@anso/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Zap, Clock, ArrowRight, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

import { cn } from '@/lib/utils';

// Validation schema
const automationSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string().max(255, 'La description ne peut pas dépasser 255 caractères').optional(),
  triggerType: z.enum(['deal_stale', 'deal_stage_changed', 'deal_created']),
  staleDays: z.coerce.number().min(1).max(365).optional(),
  fromStageId: z.string().optional(),
  toStageId: z.string().optional(),
  newDealStageId: z.string().optional(),
  taskTitle: z.string().min(1, 'Le titre de la tâche est requis').max(100),
  taskDescription: z.string().max(255).optional(),
  dueDaysFromNow: z.coerce.number().min(0).max(365),
});

type AutomationFormData = z.infer<typeof automationSchema>;

interface AutomationRuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateAutomationRuleInput) => Promise<void>;
  stages: Stage[];
  rule?: AutomationRule;
  isLoading?: boolean;
}

// Trigger type options
const TRIGGER_TYPES: {
  type: AutomationTriggerType;
  label: string;
  description: string;
  icon: typeof Clock;
}[] = [
  {
    type: 'deal_stale',
    label: 'Deal inactif',
    description: "Quand un deal n'évolue pas pendant X jours",
    icon: Clock,
  },
  {
    type: 'deal_stage_changed',
    label: 'Changement d\'étape',
    description: 'Quand un deal passe dans une étape spécifique',
    icon: ArrowRight,
  },
  {
    type: 'deal_created',
    label: 'Nouveau deal',
    description: 'Quand un nouveau deal est créé',
    icon: Plus,
  },
];

export function AutomationRuleForm({
  isOpen,
  onClose,
  onSubmit,
  stages,
  rule,
  isLoading,
}: AutomationRuleFormProps): JSX.Element {
  const isEditing = !!rule;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AutomationFormData>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      name: '',
      description: '',
      triggerType: 'deal_stale',
      staleDays: 7,
      taskTitle: '',
      taskDescription: '',
      dueDaysFromNow: 1,
    },
  });

  const triggerType = watch('triggerType');

  // Reset form when modal opens/closes or rule changes
  useEffect(() => {
    if (isOpen) {
      if (rule) {
        const staleDays =
          rule.trigger.type === 'deal_stale'
            ? (rule.trigger.config as { staleDays: number }).staleDays
            : 7;
        const fromStageId =
          rule.trigger.type === 'deal_stage_changed'
            ? (rule.trigger.config as { fromStageId?: string }).fromStageId
            : undefined;
        const toStageId =
          rule.trigger.type === 'deal_stage_changed'
            ? (rule.trigger.config as { toStageId: string }).toStageId
            : undefined;
        const newDealStageId =
          rule.trigger.type === 'deal_created'
            ? (rule.trigger.config as { stageId?: string }).stageId
            : undefined;

        reset({
          name: rule.name,
          description: rule.description ?? '',
          triggerType: rule.trigger.type,
          staleDays,
          fromStageId,
          toStageId,
          newDealStageId,
          taskTitle: rule.action.config.taskTitle,
          taskDescription: rule.action.config.taskDescription ?? '',
          dueDaysFromNow: rule.action.config.dueDaysFromNow,
        });
      } else {
        reset({
          name: '',
          description: '',
          triggerType: 'deal_stale',
          staleDays: 7,
          taskTitle: '',
          taskDescription: '',
          dueDaysFromNow: 1,
        });
      }
    }
  }, [isOpen, rule, reset]);

  const handleFormSubmit = async (data: AutomationFormData): Promise<void> => {
    // Build trigger config based on type
    let triggerConfig: Record<string, unknown>;
    switch (data.triggerType) {
      case 'deal_stale':
        triggerConfig = { staleDays: data.staleDays ?? 7 };
        break;
      case 'deal_stage_changed':
        triggerConfig = {
          fromStageId: data.fromStageId || undefined,
          toStageId: data.toStageId,
        };
        break;
      case 'deal_created':
        triggerConfig = { stageId: data.newDealStageId || undefined };
        break;
      default:
        triggerConfig = {};
    }

    const input: CreateAutomationRuleInput = {
      name: data.name,
      description: data.description || undefined,
      enabled: true,
      trigger: {
        type: data.triggerType,
        config: triggerConfig as never,
      },
      action: {
        type: 'create_task',
        config: {
          taskTitle: data.taskTitle,
          taskDescription: data.taskDescription || undefined,
          dueDaysFromNow: data.dueDaysFromNow,
        },
      },
    };

    await onSubmit(input);
    onClose();
  };

  const isPending = isLoading || isSubmitting;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <ModalHeader onClose={onClose}>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-brand-500" />
            {isEditing ? 'Modifier l\'automatisation' : 'Nouvelle automatisation'}
          </div>
        </ModalHeader>

        <ModalContent className="space-y-6">
          {/* Name & Description */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Relance deal inactif"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Description optionnelle..."
                {...register('description')}
              />
            </div>
          </div>

          {/* Trigger Type */}
          <div className="space-y-3">
            <Label>Déclencheur</Label>
            <Controller
              name="triggerType"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  {TRIGGER_TYPES.map((trigger) => {
                    const Icon = trigger.icon;
                    const isSelected = field.value === trigger.type;
                    return (
                      <button
                        key={trigger.type}
                        type="button"
                        onClick={() => field.onChange(trigger.type)}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                          isSelected
                            ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                            isSelected
                              ? 'bg-brand-100 text-brand-600'
                              : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p
                            className={cn(
                              'font-medium',
                              isSelected ? 'text-brand-700' : 'text-slate-900'
                            )}
                          >
                            {trigger.label}
                          </p>
                          <p className="text-sm text-slate-500">
                            {trigger.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>

          {/* Trigger Config */}
          <div className="space-y-4 rounded-lg bg-slate-50 p-4">
            {triggerType === 'deal_stale' && (
              <div className="space-y-2">
                <Label htmlFor="staleDays">Nombre de jours d&apos;inactivité</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="staleDays"
                    type="number"
                    min={1}
                    max={365}
                    className="w-24"
                    {...register('staleDays')}
                  />
                  <span className="text-sm text-slate-500">jours</span>
                </div>
              </div>
            )}

            {triggerType === 'deal_stage_changed' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fromStageId">De l&apos;étape (optionnel)</Label>
                  <select
                    id="fromStageId"
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    {...register('fromStageId')}
                  >
                    <option value="">N&apos;importe quelle étape</option>
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toStageId">
                    Vers l&apos;étape <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="toStageId"
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    {...register('toStageId')}
                  >
                    <option value="">Sélectionner une étape</option>
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {triggerType === 'deal_created' && (
              <div className="space-y-2">
                <Label htmlFor="newDealStageId">Dans l&apos;étape (optionnel)</Label>
                <select
                  id="newDealStageId"
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  {...register('newDealStageId')}
                >
                  <option value="">N&apos;importe quelle étape</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Config */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Action : Créer une tâche</Label>

            <div className="space-y-2">
              <Label htmlFor="taskTitle">
                Titre de la tâche <span className="text-red-500">*</span>
              </Label>
              <Input
                id="taskTitle"
                placeholder="Ex: Relancer le contact"
                {...register('taskTitle')}
                aria-invalid={!!errors.taskTitle}
              />
              {errors.taskTitle && (
                <p className="text-sm text-red-500">{errors.taskTitle.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskDescription">Description de la tâche</Label>
              <Input
                id="taskDescription"
                placeholder="Instructions supplémentaires..."
                {...register('taskDescription')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDaysFromNow">Échéance</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Dans</span>
                <Input
                  id="dueDaysFromNow"
                  type="number"
                  min={0}
                  max={365}
                  className="w-20"
                  {...register('dueDaysFromNow')}
                />
                <span className="text-sm text-slate-500">jour(s)</span>
              </div>
            </div>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Modification...' : 'Création...'}
              </>
            ) : isEditing ? (
              'Modifier'
            ) : (
              'Créer'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
