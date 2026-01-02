import type { CreateAutomationRuleInput } from '@anso/types';
import { Plan } from '@anso/types';
import { Button, Card } from '@anso/ui';
import { Loader2, Plus, Zap, Sparkles, Lock } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { AutomationRuleCard, AutomationRuleForm } from '@/components/automations';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import {
  useAutomations,
  useCreateAutomation,
  useUpdateAutomation,
  useToggleAutomation,
  useDeleteAutomation,
  DEFAULT_AUTOMATION_RULES,
} from '@/services/automations';
import { useStages } from '@/services/stages';

export function AutomationsPage(): JSX.Element {
  const { workspaceId, workspace, isLoading: isWorkspaceLoading } = useCurrentWorkspace();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);

  const currentPlan = workspace?.plan || Plan.FREE;
  const isPaidPlan = currentPlan !== Plan.FREE;

  const { data: automations = [], isLoading: isAutomationsLoading } =
    useAutomations(workspaceId);
  const { data: stages = [] } = useStages(workspaceId);

  const createMutation = useCreateAutomation(workspaceId);
  const updateMutation = useUpdateAutomation(workspaceId);
  const toggleMutation = useToggleAutomation(workspaceId);
  const deleteMutation = useDeleteAutomation(workspaceId);

  const isLoading = isWorkspaceLoading || isAutomationsLoading;

  // Get stage name by ID
  const getStageName = useCallback(
    (stageId: string): string => {
      const stage = stages.find((s) => s.id === stageId);
      return stage?.name ?? 'Étape inconnue';
    },
    [stages]
  );

  // Handle create automation
  const handleCreate = async (input: CreateAutomationRuleInput): Promise<void> => {
    await createMutation.mutateAsync(input);
  };

  // Handle update automation
  const handleUpdate = async (input: CreateAutomationRuleInput): Promise<void> => {
    if (!editingRule) return;
    await updateMutation.mutateAsync({
      automationId: editingRule,
      input,
    });
    setEditingRule(null);
  };

  // Handle toggle automation
  const handleToggle = async (automationId: string, enabled: boolean): Promise<void> => {
    await toggleMutation.mutateAsync({ automationId, enabled });
  };

  // Handle delete automation
  const handleDelete = async (automationId: string): Promise<void> => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette automatisation ?')) {
      return;
    }
    await deleteMutation.mutateAsync(automationId);
  };

  // Setup default automations
  const handleSetupDefaults = async (): Promise<void> => {
    for (const rule of DEFAULT_AUTOMATION_RULES) {
      await createMutation.mutateAsync(rule);
    }
  };

  // Get the rule being edited
  const ruleBeingEdited = editingRule
    ? automations.find((r) => r.id === editingRule)
    : undefined;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // Show upgrade prompt for free users
  if (!isPaidPlan) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <Card className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
              <Lock className="h-8 w-8 text-brand-600" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Automatisations
            </h1>
            <p className="mt-3 text-slate-600">
              Les automatisations permettent de créer des tâches automatiquement
              en fonction de l&apos;activité de vos deals. Cette fonctionnalité est
              disponible avec les plans Solo et Team.
            </p>

            <div className="mt-8 rounded-lg bg-slate-50 p-6">
              <h3 className="font-semibold text-slate-900">
                Exemples d&apos;automatisations
              </h3>
              <ul className="mt-3 space-y-2 text-left text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" />
                  <span>
                    Créer une tâche de relance quand un deal est inactif depuis 7 jours
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" />
                  <span>
                    Déclencher une action quand un deal passe en négociation
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" />
                  <span>
                    Créer une tâche d&apos;onboarding à la création d&apos;un nouveau deal
                  </span>
                </li>
              </ul>
            </div>

            <Link to="/app/settings" className="mt-8 inline-block">
              <Button size="lg">
                <Sparkles className="mr-2 h-4 w-4" />
                Passer à un plan payant
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Automatisations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Créez des règles pour automatiser vos tâches de suivi
          </p>
        </div>
        <div className="flex gap-2">
          {automations.length === 0 && (
            <Button
              variant="outline"
              onClick={handleSetupDefaults}
              disabled={createMutation.isPending}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Règles par défaut
            </Button>
          )}
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle règle
          </Button>
        </div>
      </div>

      {/* Automations List */}
      <div className="mt-8">
        {automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
              <Zap className="h-8 w-8 text-brand-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Aucune automatisation
            </h3>
            <p className="mt-2 max-w-md text-center text-sm text-slate-500">
              Les automatisations vous permettent de créer des tâches automatiquement
              en fonction de l&apos;activité de vos deals. Commencez avec les règles par
              défaut ou créez les vôtres.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={handleSetupDefaults}>
                <Sparkles className="mr-2 h-4 w-4" />
                Installer les règles par défaut
              </Button>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une règle
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {automations.map((rule) => (
              <AutomationRuleCard
                key={rule.id}
                rule={rule}
                stageName={getStageName}
                onToggle={(enabled) => handleToggle(rule.id, enabled)}
                onEdit={() => {
                  setEditingRule(rule.id);
                  setIsFormOpen(true);
                }}
                onDelete={() => handleDelete(rule.id)}
                isToggling={toggleMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info section */}
      {automations.length > 0 && (
        <div className="mt-8 rounded-lg bg-slate-50 p-4">
          <h3 className="font-medium text-slate-900">
            Comment fonctionnent les automatisations ?
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>
              • <strong>Deal inactif</strong> : Crée une tâche quand un deal n&apos;a pas évolué
              depuis X jours
            </li>
            <li>
              • <strong>Changement d&apos;étape</strong> : Crée une tâche quand un deal entre
              dans une étape spécifique
            </li>
            <li>
              • <strong>Nouveau deal</strong> : Crée une tâche automatiquement lors de la
              création d&apos;un deal
            </li>
          </ul>
        </div>
      )}

      {/* Form Modal */}
      <AutomationRuleForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRule(null);
        }}
        onSubmit={editingRule ? handleUpdate : handleCreate}
        stages={stages}
        rule={ruleBeingEdited}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
