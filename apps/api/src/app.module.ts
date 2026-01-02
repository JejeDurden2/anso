import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { TracingModule } from './shared/infrastructure/tracing/tracing.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { ContactModule } from './modules/contact/contact.module';
import { DealModule } from './modules/deal/deal.module';
import { StageModule } from './modules/stage/stage.module';
import { BillingModule } from './modules/billing/billing.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TracingModule,
    PrismaModule,
    AuthModule,
    WorkspaceModule,
    ContactModule,
    DealModule,
    StageModule,
    BillingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
