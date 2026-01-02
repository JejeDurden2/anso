import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

interface StageDto {
  id: string;
  name: string;
  color: string;
  position: number;
}

@Injectable()
export class GetStagesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(workspaceId: string): Promise<StageDto[]> {
    const stages = await this.prisma.stage.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
    });

    return stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      color: stage.color,
      position: stage.position,
    }));
  }
}
