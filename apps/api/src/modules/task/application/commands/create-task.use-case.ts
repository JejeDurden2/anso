import { Injectable } from '@nestjs/common';

import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

interface CreateTaskCommand {
  workspaceId: string;
  dealId: string;
  title: string;
  description?: string;
  dueDate: Date;
  source?: 'manual' | 'automation';
  automationRuleId?: string;
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
export class CreateTaskUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateTaskCommand): Promise<Result<TaskDto>> {
    if (!command.title || command.title.trim().length === 0) {
      return Result.fail('Task title is required');
    }

    // Verify deal exists and belongs to workspace
    const deal = await this.prisma.deal.findFirst({
      where: {
        id: command.dealId,
        workspaceId: command.workspaceId,
      },
    });

    if (!deal) {
      return Result.fail('Deal not found');
    }

    // Verify automation rule if provided
    if (command.automationRuleId) {
      const automationRule = await this.prisma.automationRule.findFirst({
        where: {
          id: command.automationRuleId,
          workspaceId: command.workspaceId,
        },
      });

      if (!automationRule) {
        return Result.fail('Automation rule not found');
      }
    }

    const task = await this.prisma.task.create({
      data: {
        workspaceId: command.workspaceId,
        dealId: command.dealId,
        title: command.title.trim(),
        description: command.description?.trim() || null,
        dueDate: command.dueDate,
        source: command.source || 'manual',
        automationRuleId: command.automationRuleId || null,
      },
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
