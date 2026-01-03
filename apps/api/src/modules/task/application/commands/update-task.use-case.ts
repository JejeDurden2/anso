import { Injectable } from '@nestjs/common';

import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

interface UpdateTaskCommand {
  workspaceId: string;
  taskId: string;
  title?: string;
  description?: string;
  dueDate?: Date;
  completed?: boolean;
}

interface TaskDto {
  id: string;
  workspaceId: string;
  dealId: string;
  title: string;
  description: string | null;
  dueDate: Date;
  completed: boolean;
  completedAt: Date | null;
  source: 'manual' | 'automation';
  automationRuleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deal: {
    id: string;
    title: string;
    value: number | null;
  } | null;
}

@Injectable()
export class UpdateTaskUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateTaskCommand): Promise<Result<TaskDto>> {
    // Verify task exists and belongs to workspace
    const existingTask = await this.prisma.task.findFirst({
      where: {
        id: command.taskId,
        workspaceId: command.workspaceId,
      },
    });

    if (!existingTask) {
      return Result.fail('Task not found');
    }

    // Validate title if provided
    if (command.title !== undefined && command.title.trim().length === 0) {
      return Result.fail('Task title cannot be empty');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (command.title !== undefined) {
      updateData.title = command.title.trim();
    }

    if (command.description !== undefined) {
      updateData.description = command.description.trim() || null;
    }

    if (command.dueDate !== undefined) {
      updateData.dueDate = command.dueDate;
    }

    if (command.completed !== undefined) {
      updateData.completed = command.completed;
      updateData.completedAt = command.completed ? new Date() : null;
    }

    const task = await this.prisma.task.update({
      where: { id: command.taskId },
      data: updateData,
      include: {
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
          },
        },
      },
    });

    return Result.ok({
      id: task.id,
      workspaceId: task.workspaceId,
      dealId: task.dealId,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      completed: task.completed,
      completedAt: task.completedAt,
      source: task.source as 'manual' | 'automation',
      automationRuleId: task.automationRuleId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      deal: task.deal
        ? {
            id: task.deal.id,
            title: task.deal.title,
            value: task.deal.value ? Number(task.deal.value) : null,
          }
        : null,
    });
  }
}
