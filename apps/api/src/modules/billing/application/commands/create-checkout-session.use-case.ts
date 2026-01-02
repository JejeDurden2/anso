import { Injectable } from '@nestjs/common';
import { Plan } from '@prisma/client';

import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { TracingService } from '@/shared/infrastructure/tracing/tracing.service';
import { StripeService } from '../../infrastructure/services/stripe.service';
import {
  WorkspaceNotFoundError,
  StripeCustomerCreationError,
  StripeCheckoutError,
} from '../../domain/errors/billing.errors';

interface CreateCheckoutSessionCommand {
  workspaceId: string;
  userId: string;
  plan: Plan;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutSessionResult {
  url: string;
}

@Injectable()
export class CreateCheckoutSessionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly tracing: TracingService
  ) {}

  async execute(command: CreateCheckoutSessionCommand): Promise<Result<CheckoutSessionResult>> {
    return this.tracing.withSpan(
      'CreateCheckoutSessionUseCase.execute',
      async (span) => {
        const { workspaceId, userId, plan, successUrl, cancelUrl } = command;

        span.setAttributes({
          'billing.workspace_id': workspaceId,
          'billing.user_id': userId,
          'billing.plan': plan,
        });

        // Get workspace with owner
        const workspace = await this.prisma.workspace.findUnique({
          where: { id: workspaceId },
          include: {
            members: {
              where: { userId },
              include: { user: true },
            },
          },
        });

        if (!workspace) {
          span.setAttributes({ 'billing.error': 'workspace_not_found' });
          return Result.fail(new WorkspaceNotFoundError(workspaceId).message);
        }

        const member = workspace.members[0];
        if (!member) {
          span.setAttributes({ 'billing.error': 'user_not_member' });
          return Result.fail('User is not a member of this workspace');
        }

        // Create or get Stripe customer
        let stripeCustomerId = workspace.stripeCustomerId;
        const isNewCustomer = !stripeCustomerId;

        if (!stripeCustomerId) {
          try {
            stripeCustomerId = await this.stripeService.createCustomer(
              member.user.email,
              member.user.name || undefined
            );

            await this.prisma.workspace.update({
              where: { id: workspaceId },
              data: { stripeCustomerId },
            });

            span.setAttributes({ 'billing.customer_created': true });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            span.setAttributes({ 'billing.error': 'customer_creation_failed' });
            return Result.fail(new StripeCustomerCreationError(message).message);
          }
        }

        span.setAttributes({
          'billing.stripe_customer_id': stripeCustomerId,
          'billing.is_new_customer': isNewCustomer,
        });

        // Create checkout session
        try {
          const url = await this.stripeService.createCheckoutSession(
            stripeCustomerId,
            plan,
            workspaceId,
            successUrl,
            cancelUrl
          );

          span.setAttributes({ 'billing.checkout_created': true });
          return Result.ok({ url });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          span.setAttributes({ 'billing.error': 'checkout_creation_failed' });
          return Result.fail(new StripeCheckoutError(message).message);
        }
      },
      { 'use_case': 'create_checkout_session' }
    );
  }
}
