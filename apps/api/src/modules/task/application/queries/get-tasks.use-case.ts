import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

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

interface GetTasksQuery {
  workspaceId: string;
  completed?: boolean;
  dealId?: string;
}

@Injectable()
export class GetTasksUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTasksQuery): Promise<TaskDto[]> {
    const where: Record<string, unknown> = {
      workspaceId: query.workspaceId,
    };

    if (query.completed !== undefined) {
      where.completed = query.completed;
    }

    if (query.dealId) {
      where.dealId = query.dealId;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
          },
        },
      },
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' },
      ],
    });

    return tasks.map((task) => ({
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
    }));
  }
}
