import { Injectable } from '@nestjs/common';

import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

interface UpdateDealCommand {
  workspaceId: string;
  dealId: string;
  title?: string;
  stageId?: string;
  contactId?: string | null;
  value?: number | null;
}

interface DealDto {
  id: string;
  title: string;
  value: number | null;
  stageId: string;
  contactId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UpdateDealUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateDealCommand): Promise<Result<DealDto>> {
    const existingDeal = await this.prisma.deal.findFirst({
      where: {
        id: command.dealId,
        workspaceId: command.workspaceId,
      },
    });

    if (!existingDeal) {
      return Result.fail('Deal not found');
    }

    if (command.title !== undefined && command.title.trim().length === 0) {
      return Result.fail('Deal title cannot be empty');
    }

    // Verify stage if changing
    if (command.stageId) {
      const stage = await this.prisma.stage.findFirst({
        where: {
          id: command.stageId,
          workspaceId: command.workspaceId,
        },
      });

      if (!stage) {
        return Result.fail('Stage not found');
      }
    }

    // Verify contact if changing
    if (command.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: {
          id: command.contactId,
          workspaceId: command.workspaceId,
        },
      });

      if (!contact) {
        return Result.fail('Contact not found');
      }
    }

    const deal = await this.prisma.deal.update({
      where: { id: command.dealId },
      data: {
        ...(command.title !== undefined && { title: command.title.trim() }),
        ...(command.stageId !== undefined && { stageId: command.stageId }),
        ...(command.contactId !== undefined && { contactId: command.contactId }),
        ...(command.value !== undefined && { value: command.value }),
      },
    });

    return Result.ok({
      id: deal.id,
      title: deal.title,
      value: deal.value ? Number(deal.value) : null,
      stageId: deal.stageId,
      contactId: deal.contactId,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    });
  }
}
