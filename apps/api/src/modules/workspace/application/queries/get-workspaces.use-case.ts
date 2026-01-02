import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

interface WorkspaceDto {
  id: string;
  name: string;
  plan: string;
  role: string;
  createdAt: Date;
}

@Injectable()
export class GetWorkspacesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<WorkspaceDto[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: true,
      },
    });

    return memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      plan: membership.workspace.plan,
      role: membership.role,
      createdAt: membership.workspace.createdAt,
    }));
  }
}
