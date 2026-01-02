import { Injectable } from '@nestjs/common';
import { Plan } from '@prisma/client';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { getPlanContactLimit } from '../../domain/constants/plans';

export interface PlanLimitCheck {
  allowed: boolean;
  currentCount: number;
  limit: number | null;
  remaining: number | null;
}

@Injectable()
export class PlanLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  async canAddContact(workspaceId: string): Promise<PlanLimitCheck> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });

    if (!workspace) {
      return {
        allowed: false,
        currentCount: 0,
        limit: 0,
        remaining: 0,
      };
    }

    const limit = getPlanContactLimit(workspace.plan);
    const currentCount = workspace._count.contacts;

    // null limit means unlimited
    if (limit === null) {
      return {
        allowed: true,
        currentCount,
        limit: null,
        remaining: null,
      };
    }

    const remaining = Math.max(0, limit - currentCount);
    const allowed = currentCount < limit;

    return {
      allowed,
      currentCount,
      limit,
      remaining,
    };
  }

  async getWorkspacePlan(workspaceId: string): Promise<Plan | null> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { plan: true },
    });

    return workspace?.plan ?? null;
  }

  async getWorkspacePlanInfo(workspaceId: string): Promise<{
    plan: Plan;
    contactLimit: number | null;
    contactCount: number;
    hasSubscription: boolean;
  } | null> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });

    if (!workspace) {
      return null;
    }

    return {
      plan: workspace.plan,
      contactLimit: getPlanContactLimit(workspace.plan),
      contactCount: workspace._count.contacts,
      hasSubscription: !!workspace.stripeSubscriptionId,
    };
  }
}
