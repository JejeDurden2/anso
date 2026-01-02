import { Module } from '@nestjs/common';

import { DealController } from './infrastructure/http/deal.controller';
import { GetDealsUseCase } from './application/queries/get-deals.use-case';
import { CreateDealUseCase } from './application/commands/create-deal.use-case';
import { UpdateDealUseCase } from './application/commands/update-deal.use-case';
import { DeleteDealUseCase } from './application/commands/delete-deal.use-case';

@Module({
  controllers: [DealController],
  providers: [GetDealsUseCase, CreateDealUseCase, UpdateDealUseCase, DeleteDealUseCase],
})
export class DealModule {}
