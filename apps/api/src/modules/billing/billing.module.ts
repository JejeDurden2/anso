import { Module } from '@nestjs/common';

import { BillingController } from './infrastructure/http/billing.controller';
import { StripeService } from './infrastructure/services/stripe.service';
import { CreateCheckoutSessionUseCase } from './application/commands/create-checkout-session.use-case';
import { CreatePortalSessionUseCase } from './application/commands/create-portal-session.use-case';
import { HandleWebhookUseCase } from './application/commands/handle-webhook.use-case';
import { PlanLimitsService } from './application/services/plan-limits.service';

@Module({
  controllers: [BillingController],
  providers: [
    StripeService,
    CreateCheckoutSessionUseCase,
    CreatePortalSessionUseCase,
    HandleWebhookUseCase,
    PlanLimitsService,
  ],
  exports: [PlanLimitsService],
})
export class BillingModule {}
