import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { JwtAuthGuard, WorkspaceGuard } from '@/shared/infrastructure/guards';
import { GetStagesUseCase } from '../../application/queries/get-stages.use-case';
import { CreateStageUseCase } from '../../application/commands/create-stage.use-case';
import { UpdateStageUseCase } from '../../application/commands/update-stage.use-case';
import { ReorderStagesUseCase } from '../../application/commands/reorder-stages.use-case';
import { DeleteStageUseCase } from '../../application/commands/delete-stage.use-case';
import { CreateStageDto } from './dtos/create-stage.dto';
import { UpdateStageDto } from './dtos/update-stage.dto';
import { ReorderStagesDto } from './dtos/reorder-stages.dto';

@Controller('workspaces/:wid/stages')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class StageController {
  constructor(
    private readonly getStagesUseCase: GetStagesUseCase,
    private readonly createStageUseCase: CreateStageUseCase,
    private readonly updateStageUseCase: UpdateStageUseCase,
    private readonly reorderStagesUseCase: ReorderStagesUseCase,
    private readonly deleteStageUseCase: DeleteStageUseCase
  ) {}

  @Get()
  async getStages(
    @Param('wid') workspaceId: string
  ): Promise<{ success: boolean; data: unknown[] }> {
    const stages = await this.getStagesUseCase.execute(workspaceId);

    return {
      success: true,
      data: stages,
    };
  }

  @Post()
  async createStage(
    @Param('wid') workspaceId: string,
    @Body() dto: CreateStageDto
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.createStageUseCase.execute({
      workspaceId,
      ...dto,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: result.value,
    };
  }

  @Patch('reorder')
  async reorderStages(
    @Param('wid') workspaceId: string,
    @Body() dto: ReorderStagesDto
  ): Promise<{ success: boolean; data: unknown[] }> {
    const result = await this.reorderStagesUseCase.execute({
      workspaceId,
      stages: dto.stages,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: result.value,
    };
  }

  @Patch(':id')
  async updateStage(
    @Param('wid') workspaceId: string,
    @Param('id') stageId: string,
    @Body() dto: UpdateStageDto
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.updateStageUseCase.execute({
      workspaceId,
      stageId,
      ...dto,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: result.value,
    };
  }

  @Delete(':id')
  async deleteStage(
    @Param('wid') workspaceId: string,
    @Param('id') stageId: string
  ): Promise<{ success: boolean; data: null }> {
    const result = await this.deleteStageUseCase.execute(workspaceId, stageId);

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: null,
    };
  }
}
