import { Injectable } from '@nestjs/common';

import { PlanLimitsService } from '@/modules/billing/application/services/plan-limits.service';
import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { TracingService } from '@/shared/infrastructure/tracing/tracing.service';

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
    private readonly planLimitsService: PlanLimitsService,
    private readonly tracing: TracingService
  ) {}

  async execute(command: CreateContactCommand): Promise<Result<ContactDto>> {
    return this.tracing.withSpan(
      'CreateContactUseCase.execute',
      async (span) => {
        span.setAttributes({
          'contact.workspace_id': command.workspaceId,
          'contact.has_email': !!command.email,
          'contact.has_phone': !!command.phone,
          'contact.has_company': !!command.company,
          'contact.tags_count': command.tags?.length || 0,
        });

        if (!command.name || command.name.trim().length === 0) {
          span.setAttributes({ 'contact.validation_error': 'name_required' });
          return Result.fail('Contact name is required');
        }

        // Check workspace contact limit based on plan
        const limitCheck = await this.planLimitsService.canAddContact(command.workspaceId);
        span.setAttributes({
          'plan.limit_allowed': limitCheck.allowed,
          'plan.current_count': limitCheck.currentCount,
          'plan.limit': limitCheck.limit || -1,
        });

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

        span.setAttributes({ 'contact.id': contact.id });

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
      },
      { 'use_case': 'create_contact' }
    );
  }
}
