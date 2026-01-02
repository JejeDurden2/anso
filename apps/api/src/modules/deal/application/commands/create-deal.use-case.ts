import { Injectable } from '@nestjs/common';

import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

interface CreateDealCommand {
  workspaceId: string;
  title: string;
  stageId: string;
  contactId?: string;
  value?: number;
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
export class CreateDealUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateDealCommand): Promise<Result<DealDto>> {
    if (!command.title || command.title.trim().length === 0) {
      return Result.fail('Deal title is required');
    }

    // Verify stage exists and belongs to workspace
    const stage = await this.prisma.stage.findFirst({
      where: {
        id: command.stageId,
        workspaceId: command.workspaceId,
      },
    });

    if (!stage) {
      return Result.fail('Stage not found');
    }

    // Verify contact if provided
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

    const deal = await this.prisma.deal.create({
      data: {
        workspaceId: command.workspaceId,
        title: command.title.trim(),
        stageId: command.stageId,
        contactId: command.contactId || null,
        value: command.value || null,
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
