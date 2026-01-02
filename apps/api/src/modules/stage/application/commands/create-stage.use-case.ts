import { Injectable } from '@nestjs/common';

import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

interface CreateStageCommand {
  workspaceId: string;
  name: string;
  color?: string;
}

interface StageDto {
  id: string;
  name: string;
  color: string;
  position: number;
}

@Injectable()
export class CreateStageUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateStageCommand): Promise<Result<StageDto>> {
    if (!command.name || command.name.trim().length === 0) {
      return Result.fail('Stage name is required');
    }

    // Get the highest position
    const lastStage = await this.prisma.stage.findFirst({
      where: { workspaceId: command.workspaceId },
      orderBy: { position: 'desc' },
    });

    const position = lastStage ? lastStage.position + 1 : 0;

    const stage = await this.prisma.stage.create({
      data: {
        workspaceId: command.workspaceId,
        name: command.name.trim(),
        color: command.color || '#64748b',
        position,
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
