export class WorkspaceNotFoundError extends Error {
  constructor(workspaceId: string) {
    super(`Workspace ${workspaceId} not found`);
    this.name = 'WorkspaceNotFoundError';
  }
}

export class StripeCustomerCreationError extends Error {
  constructor(message: string) {
    super(`Failed to create Stripe customer: ${message}`);
    this.name = 'StripeCustomerCreationError';
  }
}

export class StripeCheckoutError extends Error {
  constructor(message: string) {
    super(`Failed to create checkout session: ${message}`);
    this.name = 'StripeCheckoutError';
  }
}

export class StripePortalError extends Error {
  constructor(message: string) {
    super(`Failed to create portal session: ${message}`);
    this.name = 'StripePortalError';
  }
}

export class PlanLimitExceededError extends Error {
  constructor(limit: number) {
    super(`Vous avez atteint la limite de ${limit} contacts pour votre plan. Passez à un plan supérieur pour en ajouter davantage.`);
    this.name = 'PlanLimitExceededError';
  }
}
