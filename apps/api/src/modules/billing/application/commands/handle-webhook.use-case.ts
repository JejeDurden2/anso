import { Injectable, Logger } from '@nestjs/common';
import { Plan } from '@prisma/client';
import Stripe from 'stripe';

import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

import { StripeService } from '../../infrastructure/services/stripe.service';

@Injectable()
export class HandleWebhookUseCase {
  private readonly logger = new Logger(HandleWebhookUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService
  ) {}

  async execute(payload: Buffer, signature: string): Promise<Result<void>> {
    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(payload, signature);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Webhook signature verification failed: ${message}`);
      return Result.fail(`Webhook signature verification failed: ${message}`);
    }

    this.logger.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        return this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);

      case 'customer.subscription.updated':
        return this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);

      case 'customer.subscription.deleted':
        return this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
        return Result.ok(undefined);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<Result<void>> {
    const workspaceId = session.metadata?.workspaceId;
    const plan = session.metadata?.plan as Plan | undefined;
    const subscriptionId = session.subscription as string;

    if (!workspaceId || !plan) {
      this.logger.error('Missing metadata in checkout session');
      return Result.fail('Missing metadata in checkout session');
    }

    try {
      await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          plan,
          stripeSubscriptionId: subscriptionId,
        },
      });

      this.logger.log(`Workspace ${workspaceId} upgraded to ${plan}`);
      return Result.ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update workspace: ${message}`);
      return Result.fail(`Failed to update workspace: ${message}`);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<Result<void>> {
    const workspaceId = subscription.metadata?.workspaceId;

    if (!workspaceId) {
      // Try to find workspace by subscription ID
      const workspace = await this.prisma.workspace.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (!workspace) {
        this.logger.warn(`No workspace found for subscription ${subscription.id}`);
        return Result.ok(undefined);
      }

      // Handle subscription status changes
      if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
        await this.prisma.workspace.update({
          where: { id: workspace.id },
          data: {
            plan: Plan.FREE,
            stripeSubscriptionId: null,
          },
        });
        this.logger.log(`Workspace ${workspace.id} downgraded to FREE due to ${subscription.status}`);
      }

      return Result.ok(undefined);
    }

    // Handle plan changes from metadata
    const newPlan = subscription.metadata?.plan as Plan | undefined;
    if (newPlan) {
      await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { plan: newPlan },
      });
      this.logger.log(`Workspace ${workspaceId} plan updated to ${newPlan}`);
    }

    return Result.ok(undefined);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<Result<void>> {
    // Find workspace by subscription ID
    const workspace = await this.prisma.workspace.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!workspace) {
      this.logger.warn(`No workspace found for deleted subscription ${subscription.id}`);
      return Result.ok(undefined);
    }

    // Downgrade to free plan
    await this.prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        plan: Plan.FREE,
        stripeSubscriptionId: null,
      },
    });

    this.logger.log(`Workspace ${workspace.id} downgraded to FREE after subscription cancellation`);
    return Result.ok(undefined);
  }
}
