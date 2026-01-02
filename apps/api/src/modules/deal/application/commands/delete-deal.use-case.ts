import { Injectable } from '@nestjs/common';

import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

@Injectable()
export class DeleteDealUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(workspaceId: string, dealId: string): Promise<Result<void>> {
    const existingDeal = await this.prisma.deal.findFirst({
      where: {
        id: dealId,
        workspaceId,
      },
    });

    if (!existingDeal) {
      return Result.fail('Deal not found');
    }

    await this.prisma.deal.delete({
      where: { id: dealId },
    });

    return Result.ok(undefined as void);
  }
}
