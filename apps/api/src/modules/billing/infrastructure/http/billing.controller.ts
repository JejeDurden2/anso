import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  RawBodyRequest,
  Headers,
} from '@nestjs/common';
import { Plan } from '@prisma/client';
import { Request } from 'express';

import { JwtAuthGuard, WorkspaceGuard } from '@/shared/infrastructure/guards';

import { CreateCheckoutSessionUseCase } from '../../application/commands/create-checkout-session.use-case';
import { CreatePortalSessionUseCase } from '../../application/commands/create-portal-session.use-case';
import { HandleWebhookUseCase } from '../../application/commands/handle-webhook.use-case';

import { CreateCheckoutDto } from './dtos/create-checkout.dto';
import { CreatePortalDto } from './dtos/create-portal.dto';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

@Controller()
export class BillingController {
  constructor(
    private readonly createCheckoutSessionUseCase: CreateCheckoutSessionUseCase,
    private readonly createPortalSessionUseCase: CreatePortalSessionUseCase,
    private readonly handleWebhookUseCase: HandleWebhookUseCase
  ) {}

  @Post('workspaces/:workspaceId/billing/checkout')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  async createCheckoutSession(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateCheckoutDto,
    @Req() req: AuthenticatedRequest
  ): Promise<{ success: boolean; data: { url: string } }> {
    // Prevent checkout for FREE plan
    if (dto.plan === Plan.FREE) {
      throw new BadRequestException('Cannot checkout for FREE plan');
    }

    const result = await this.createCheckoutSessionUseCase.execute({
      workspaceId,
      userId: req.user.id,
      plan: dto.plan,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: result.value,
    };
  }

  @Post('workspaces/:workspaceId/billing/portal')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  async createPortalSession(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreatePortalDto
  ): Promise<{ success: boolean; data: { url: string } }> {
    const result = await this.createPortalSessionUseCase.execute({
      workspaceId,
      returnUrl: dto.returnUrl,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: result.value,
    };
  }

  @Post('billing/webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ): Promise<{ received: boolean }> {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    const result = await this.handleWebhookUseCase.execute(req.rawBody, signature);

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return { received: true };
  }
}
