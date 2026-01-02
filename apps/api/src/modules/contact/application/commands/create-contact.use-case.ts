import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { Result } from '@/shared/domain';
import { PlanLimitsService } from '@/modules/billing/application/services/plan-limits.service';

interface CreateContactCommand {
  workspaceId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  tags?: string[];
}

interface ContactDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CreateContactUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimitsService: PlanLimitsService
  ) {}

  async execute(command: CreateContactCommand): Promise<Result<ContactDto>> {
    if (!command.name || command.name.trim().length === 0) {
      return Result.fail('Contact name is required');
    }

    // Check workspace contact limit based on plan
    const limitCheck = await this.planLimitsService.canAddContact(command.workspaceId);
    if (!limitCheck.allowed) {
      return Result.fail(
        `Vous avez atteint la limite de ${limitCheck.limit} contacts pour votre plan. Passez à un plan supérieur pour en ajouter davantage.`
      );
    }

    const contact = await this.prisma.contact.create({
      data: {
        workspaceId: command.workspaceId,
        name: command.name.trim(),
        email: command.email?.trim() || null,
        phone: command.phone?.trim() || null,
        company: command.company?.trim() || null,
        notes: command.notes?.trim() || null,
        tags: command.tags || [],
      },
    });

    return Result.ok({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      notes: contact.notes,
      tags: contact.tags,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    });
  }
}
