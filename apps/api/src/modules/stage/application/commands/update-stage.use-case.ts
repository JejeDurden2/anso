import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { Result } from '@/shared/domain';

interface UpdateStageCommand {
  workspaceId: string;
  stageId: string;
  name?: string;
  color?: string;
}

interface StageDto {
  id: string;
  name: string;
  color: string;
  position: number;
}

@Injectable()
export class UpdateStageUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateStageCommand): Promise<Result<StageDto>> {
    const existingStage = await this.prisma.stage.findFirst({
      where: {
        id: command.stageId,
        workspaceId: command.workspaceId,
      },
    });

    if (!existingStage) {
      return Result.fail('Stage not found');
    }

    if (command.name !== undefined && command.name.trim().length === 0) {
      return Result.fail('Stage name cannot be empty');
    }

    const stage = await this.prisma.stage.update({
      where: { id: command.stageId },
      data: {
        ...(command.name !== undefined && { name: command.name.trim() }),
        ...(command.color !== undefined && { color: command.color }),
      },
    });

    return Result.ok({
      id: stage.id,
      name: stage.name,
      color: stage.color,
      position: stage.position,
    });
  }
}
