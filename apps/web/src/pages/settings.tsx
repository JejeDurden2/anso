import { Plan } from '@anso/types';
import { Button, Card, CardContent, CardHeader, Input, Avatar } from '@anso/ui';
import { Check, Loader2, CreditCard, Zap } from 'lucide-react';
import { useState } from 'react';


import { useAuth } from '@/contexts/auth-context';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import {
  useCreateCheckoutSession,
  useCreatePortalSession,
  PLAN_CONFIG,
  type Plan as BillingPlan,
} from '@/services/billing';

function PlanCard({
  plan,
  currentPlan,
  onUpgrade,
  isLoading,
}: {
  plan: BillingPlan;
  currentPlan: Plan;
  onUpgrade: (plan: BillingPlan) => void;
  isLoading: boolean;
}): JSX.Element {
  const config = PLAN_CONFIG[plan];
  const isCurrent = currentPlan === plan;
  const isUpgrade = plan !== 'FREE' && currentPlan === 'FREE';
  const isDowngrade = plan === 'FREE' && currentPlan !== 'FREE';

  return (
    <Card className={`relative ${isCurrent ? 'ring-2 ring-brand-500' : ''}`}>
      {isCurrent && (
        <div className="absolute -top-3 left-4">
          <span className="inline-flex items-center rounded-full bg-brand-500 px-3 py-1 text-xs font-medium text-white">
            Plan actuel
          </span>
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{config.name}</h3>
          <div className="text-right">
            <span className="text-2xl font-bold text-slate-900">{config.price}€</span>
            {config.price > 0 && <span className="text-sm text-slate-500">/mois</span>}
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {config.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
              <Check className="h-4 w-4 flex-shrink-0 text-brand-500" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {isCurrent ? (
            <Button variant="outline" className="w-full" disabled>
              Plan actuel
            </Button>
          ) : isUpgrade ? (
            <Button
              className="w-full"
              onClick={() => onUpgrade(plan)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Passer à {config.name}
                </>
              )}
            </Button>
          ) : isDowngrade ? (
            <Button variant="outline" className="w-full" disabled>
              Gérer via le portail
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => onUpgrade(plan)} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                `Passer à ${config.name}`
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPage(): JSX.Element {
  const { user } = useAuth();
  const { workspace, workspaceId } = useCurrentWorkspace();
  const [workspaceName, setWorkspaceName] = useState(workspace?.name || '');

  const checkoutMutation = useCreateCheckoutSession(workspaceId);
  const portalMutation = useCreatePortalSession(workspaceId);

  const currentPlan = workspace?.plan || Plan.FREE;
  const hasSubscription = currentPlan !== Plan.FREE;

  const handleUpgrade = (plan: BillingPlan): void => {
    const currentUrl = window.location.origin;
    checkoutMutation.mutate({
      plan,
      successUrl: `${currentUrl}/app/settings?upgrade=success`,
      cancelUrl: `${currentUrl}/app/settings?upgrade=cancelled`,
    });
  };

  const handleManageSubscription = (): void => {
    const currentUrl = window.location.origin;
    portalMutation.mutate({
      returnUrl: `${currentUrl}/app/settings`,
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>

      <div className="mt-8 max-w-4xl space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Profil</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar src={user?.avatarUrl} name={user?.name || user?.email} size="xl" />
              <div>
                <p className="font-medium text-slate-900">{user?.name || 'Utilisateur'}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workspace */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Espace de travail</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label htmlFor="workspace-name" className="block text-sm font-medium text-slate-700">
                  Nom de l&apos;espace
                </label>
                <Input
                  id="workspace-name"
                  placeholder="Mon entreprise"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button>Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Abonnement</h2>
              {hasSubscription && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={portalMutation.isPending}
                >
                  {portalMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Gérer l&apos;abonnement
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {(['FREE', 'SOLO', 'TEAM'] as const).map((plan) => (
                <PlanCard
                  key={plan}
                  plan={plan}
                  currentPlan={currentPlan}
                  onUpgrade={handleUpgrade}
                  isLoading={checkoutMutation.isPending}
                />
              ))}
            </div>

            {checkoutMutation.isError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {checkoutMutation.error instanceof Error
                  ? checkoutMutation.error.message
                  : 'Une erreur est survenue lors de la création de la session de paiement.'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-red-200">
          <CardHeader>
            <h2 className="text-lg font-semibold text-red-600">Zone dangereuse</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Une fois votre compte supprimé, toutes vos données seront définitivement effacées.
            </p>
            <Button variant="destructive" className="mt-4">
              Supprimer mon compte
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
