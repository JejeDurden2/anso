import { Injectable } from '@nestjs/common';

import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

import { WorkspaceNotFoundError, StripePortalError } from '../../domain/errors/billing.errors';
import { StripeService } from '../../infrastructure/services/stripe.service';

interface CreatePortalSessionCommand {
  workspaceId: string;
  returnUrl: string;
}

interface PortalSessionResult {
  url: string;
}

@Injectable()
export class CreatePortalSessionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService
  ) {}

  async execute(command: CreatePortalSessionCommand): Promise<Result<PortalSessionResult>> {
    const { workspaceId, returnUrl } = command;

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return Result.fail(new WorkspaceNotFoundError(workspaceId).message);
    }

    if (!workspace.stripeCustomerId) {
      return Result.fail('No subscription found for this workspace');
    }

    try {
      const url = await this.stripeService.createPortalSession(
        workspace.stripeCustomerId,
        returnUrl
      );

      return Result.ok({ url });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(new StripePortalError(message).message);
    }
  }
}
