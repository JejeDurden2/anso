import { Module } from '@nestjs/common';

import { CreateDealUseCase } from './application/commands/create-deal.use-case';
import { DeleteDealUseCase } from './application/commands/delete-deal.use-case';
import { UpdateDealUseCase } from './application/commands/update-deal.use-case';
import { GetDealsUseCase } from './application/queries/get-deals.use-case';
import { DealController } from './infrastructure/http/deal.controller';

@Module({
  controllers: [DealController],
  providers: [GetDealsUseCase, CreateDealUseCase, UpdateDealUseCase, DeleteDealUseCase],
})
export class DealModule {}
