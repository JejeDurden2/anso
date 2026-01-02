import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '@/shared/infrastructure/guards';
import { GetWorkspacesUseCase } from '../../application/queries/get-workspaces.use-case';
import { CreateWorkspaceUseCase } from '../../application/commands/create-workspace.use-case';
import { CreateWorkspaceDto } from './dtos/create-workspace.dto';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(
    private readonly getWorkspacesUseCase: GetWorkspacesUseCase,
    private readonly createWorkspaceUseCase: CreateWorkspaceUseCase
  ) {}

  @Get()
  async getWorkspaces(@Req() req: AuthenticatedRequest): Promise<{
    success: boolean;
    data: unknown[];
  }> {
    const workspaces = await this.getWorkspacesUseCase.execute(req.user.id);

    return {
      success: true,
      data: workspaces,
    };
  }

  @Post()
  async createWorkspace(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateWorkspaceDto
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.createWorkspaceUseCase.execute({
      name: dto.name,
      userId: req.user.id,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: result.value,
    };
  }
}
