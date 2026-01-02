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
  NotFoundException,
} from '@nestjs/common';

import { JwtAuthGuard, WorkspaceGuard } from '@/shared/infrastructure/guards';
import { GetDealsUseCase } from '../../application/queries/get-deals.use-case';
import { CreateDealUseCase } from '../../application/commands/create-deal.use-case';
import { UpdateDealUseCase } from '../../application/commands/update-deal.use-case';
import { DeleteDealUseCase } from '../../application/commands/delete-deal.use-case';
import { CreateDealDto } from './dtos/create-deal.dto';
import { UpdateDealDto } from './dtos/update-deal.dto';

@Controller('workspaces/:wid/deals')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class DealController {
  constructor(
    private readonly getDealsUseCase: GetDealsUseCase,
    private readonly createDealUseCase: CreateDealUseCase,
    private readonly updateDealUseCase: UpdateDealUseCase,
    private readonly deleteDealUseCase: DeleteDealUseCase
  ) {}

  @Get()
  async getDeals(
    @Param('wid') workspaceId: string
  ): Promise<{ success: boolean; data: unknown[] }> {
    const deals = await this.getDealsUseCase.execute(workspaceId);

    return {
      success: true,
      data: deals,
    };
  }

  @Post()
  async createDeal(
    @Param('wid') workspaceId: string,
    @Body() dto: CreateDealDto
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.createDealUseCase.execute({
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

  @Patch(':id')
  async updateDeal(
    @Param('wid') workspaceId: string,
    @Param('id') dealId: string,
    @Body() dto: UpdateDealDto
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.updateDealUseCase.execute({
      workspaceId,
      dealId,
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
  async deleteDeal(
    @Param('wid') workspaceId: string,
    @Param('id') dealId: string
  ): Promise<{ success: boolean; data: null }> {
    const result = await this.deleteDealUseCase.execute(workspaceId, dealId);

    if (result.isFailure) {
      throw new NotFoundException(result.error);
    }

    return {
      success: true,
      data: null,
    };
  }
}
