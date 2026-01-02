import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

interface DealDto {
  id: string;
  title: string;
  value: number | null;
  stageId: string;
  contactId: string | null;
  contact: { id: string; name: string } | null;
  stage: { id: string; name: string; color: string };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GetDealsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(workspaceId: string): Promise<DealDto[]> {
    const deals = await this.prisma.deal.findMany({
      where: { workspaceId },
      include: {
        contact: {
          select: { id: true, name: true },
        },
        stage: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return deals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      value: deal.value ? Number(deal.value) : null,
      stageId: deal.stageId,
      contactId: deal.contactId,
      contact: deal.contact,
      stage: deal.stage,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    }));
  }
}
