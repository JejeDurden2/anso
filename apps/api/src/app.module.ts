import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { ContactModule } from './modules/contact/contact.module';
import { DealModule } from './modules/deal/deal.module';
import { StageModule } from './modules/stage/stage.module';
import { TaskModule } from './modules/task/task.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { TracingModule } from './shared/infrastructure/tracing/tracing.module';

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
    TaskModule,
    BillingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
