import { Injectable } from '@nestjs/common';
import { Plan } from '@prisma/client';

import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
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
    private readonly stripeService: StripeService
  ) {}

  async execute(command: CreateCheckoutSessionCommand): Promise<Result<CheckoutSessionResult>> {
    const { workspaceId, userId, plan, successUrl, cancelUrl } = command;

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
      return Result.fail(new WorkspaceNotFoundError(workspaceId).message);
    }

    const member = workspace.members[0];
    if (!member) {
      return Result.fail('User is not a member of this workspace');
    }

    // Create or get Stripe customer
    let stripeCustomerId = workspace.stripeCustomerId;

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
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return Result.fail(new StripeCustomerCreationError(message).message);
      }
    }

    // Create checkout session
    try {
      const url = await this.stripeService.createCheckoutSession(
        stripeCustomerId,
        plan,
        workspaceId,
        successUrl,
        cancelUrl
      );

      return Result.ok({ url });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(new StripeCheckoutError(message).message);
    }
  }
}
