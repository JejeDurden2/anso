import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { Result } from '@/shared/domain';

interface ReorderStagesCommand {
  workspaceId: string;
  stages: { id: string; position: number }[];
}

interface StageDto {
  id: string;
  name: string;
  color: string;
  position: number;
}

@Injectable()
export class ReorderStagesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: ReorderStagesCommand): Promise<Result<StageDto[]>> {
    // Verify all stages belong to the workspace
    const existingStages = await this.prisma.stage.findMany({
      where: { workspaceId: command.workspaceId },
    });

    const existingIds = new Set(existingStages.map((s) => s.id));
    const providedIds = new Set(command.stages.map((s) => s.id));

    for (const id of providedIds) {
      if (!existingIds.has(id)) {
        return Result.fail(`Stage ${id} not found`);
      }
    }

    // Update positions in a transaction
    await this.prisma.$transaction(
      command.stages.map((stage) =>
        this.prisma.stage.update({
          where: { id: stage.id },
          data: { position: stage.position },
        })
      )
    );

    // Return updated stages
    const updatedStages = await this.prisma.stage.findMany({
      where: { workspaceId: command.workspaceId },
      orderBy: { position: 'asc' },
    });

    return Result.ok(
      updatedStages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        color: stage.color,
        position: stage.position,
      }))
    );
  }
}
