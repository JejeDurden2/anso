import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { JwtAuthGuard, WorkspaceGuard } from '@/shared/infrastructure/guards';

import { CreateTaskUseCase } from '../../application/commands/create-task.use-case';
import { DeleteTaskUseCase } from '../../application/commands/delete-task.use-case';
import { UpdateTaskUseCase } from '../../application/commands/update-task.use-case';
import { GetTasksUseCase } from '../../application/queries/get-tasks.use-case';

import { CreateTaskDto } from './dtos/create-task.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';

@Controller('workspaces/:wid/tasks')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class TaskController {
  constructor(
    private readonly getTasksUseCase: GetTasksUseCase,
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly updateTaskUseCase: UpdateTaskUseCase,
    private readonly deleteTaskUseCase: DeleteTaskUseCase
  ) {}

  @Get()
  async getTasks(
    @Param('wid') workspaceId: string,
    @Query('completed') completed?: string,
    @Query('dealId') dealId?: string
  ): Promise<{ success: boolean; data: unknown[] }> {
    const tasks = await this.getTasksUseCase.execute({
      workspaceId,
      completed: completed !== undefined ? completed === 'true' : undefined,
      dealId,
    });

    return {
      success: true,
      data: tasks,
    };
  }

  @Post()
  async createTask(
    @Param('wid') workspaceId: string,
    @Body() dto: CreateTaskDto
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.createTaskUseCase.execute({
      workspaceId,
      dealId: dto.dealId,
      title: dto.title,
      description: dto.description,
      dueDate: new Date(dto.dueDate),
      source: dto.source,
      automationRuleId: dto.automationRuleId,
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
  async updateTask(
    @Param('wid') workspaceId: string,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.updateTaskUseCase.execute({
      workspaceId,
      taskId,
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      completed: dto.completed,
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
  async deleteTask(
    @Param('wid') workspaceId: string,
    @Param('id') taskId: string
  ): Promise<{ success: boolean; data: null }> {
    const result = await this.deleteTaskUseCase.execute(workspaceId, taskId);

    if (result.isFailure) {
      throw new NotFoundException(result.error);
    }

    return {
      success: true,
      data: null,
    };
  }
}
