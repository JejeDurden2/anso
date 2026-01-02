import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { Result } from '@/shared/domain';

@Injectable()
export class DeleteStageUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(workspaceId: string, stageId: string): Promise<Result<void>> {
    const existingStage = await this.prisma.stage.findFirst({
      where: {
        id: stageId,
        workspaceId,
      },
      include: { _count: { select: { deals: true } } },
    });

    if (!existingStage) {
      return Result.fail('Stage not found');
    }

    if (existingStage._count.deals > 0) {
      return Result.fail('Cannot delete stage with existing deals');
    }

    // Check if it's the last stage
    const stageCount = await this.prisma.stage.count({
      where: { workspaceId },
    });

    if (stageCount <= 1) {
      return Result.fail('Cannot delete the last stage');
    }

    await this.prisma.stage.delete({
      where: { id: stageId },
    });

    return Result.ok(undefined as void);
  }
}
