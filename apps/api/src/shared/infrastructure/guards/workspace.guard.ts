import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';

import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedUser {
  id: string;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  workspace?: {
    id: string;
    role: string;
  };
}

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const workspaceId = request.params.workspaceId || request.params.wid;

    if (!workspaceId) {
      return true;
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      const workspaceExists = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspaceExists) {
        throw new NotFoundException('Workspace not found');
      }

      throw new ForbiddenException('You do not have access to this workspace');
    }

    request.workspace = {
      id: workspaceId,
      role: membership.role,
    };

    return true;
  }
}
