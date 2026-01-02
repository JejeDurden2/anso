import { Module } from '@nestjs/common';

import { CreateStageUseCase } from './application/commands/create-stage.use-case';
import { DeleteStageUseCase } from './application/commands/delete-stage.use-case';
import { ReorderStagesUseCase } from './application/commands/reorder-stages.use-case';
import { UpdateStageUseCase } from './application/commands/update-stage.use-case';
import { GetStagesUseCase } from './application/queries/get-stages.use-case';
import { StageController } from './infrastructure/http/stage.controller';

@Module({
  controllers: [StageController],
  providers: [
    GetStagesUseCase,
    CreateStageUseCase,
    UpdateStageUseCase,
    ReorderStagesUseCase,
    DeleteStageUseCase,
  ],
})
export class StageModule {}
