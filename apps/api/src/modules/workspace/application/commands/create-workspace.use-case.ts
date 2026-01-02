import { Injectable } from '@nestjs/common';

import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

interface CreateWorkspaceCommand {
  name: string;
  userId: string;
}

interface WorkspaceDto {
  id: string;
  name: string;
  plan: string;
  createdAt: Date;
}

@Injectable()
export class CreateWorkspaceUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateWorkspaceCommand): Promise<Result<WorkspaceDto>> {
    if (!command.name || command.name.trim().length === 0) {
      return Result.fail('Workspace name is required');
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        name: command.name.trim(),
        members: {
          create: {
            userId: command.userId,
            role: 'OWNER',
          },
        },
        stages: {
          createMany: {
            data: [
              { name: 'Prospect', color: '#64748b', position: 0 },
              { name: 'Qualification', color: '#0ea5e9', position: 1 },
              { name: 'Proposition', color: '#f59e0b', position: 2 },
              { name: 'Négociation', color: '#8b5cf6', position: 3 },
              { name: 'Gagné', color: '#22c55e', position: 4 },
            ],
          },
        },
      },
    });

    return Result.ok({
      id: workspace.id,
      name: workspace.name,
      plan: workspace.plan,
      createdAt: workspace.createdAt,
    });
  }
}
