import { Injectable } from '@nestjs/common';

import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

@Injectable()
export class DeleteTaskUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(workspaceId: string, taskId: string): Promise<Result<void>> {
    // Verify task exists and belongs to workspace
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        workspaceId,
      },
    });

    if (!task) {
      return Result.fail('Task not found');
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return Result.ok(undefined);
  }
}
