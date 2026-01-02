import { Injectable } from '@nestjs/common';

import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

interface UpdateContactCommand {
  workspaceId: string;
  contactId: string;
  name?: string;
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
export class UpdateContactUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateContactCommand): Promise<Result<ContactDto>> {
    const existingContact = await this.prisma.contact.findFirst({
      where: {
        id: command.contactId,
        workspaceId: command.workspaceId,
      },
    });

    if (!existingContact) {
      return Result.fail('Contact not found');
    }

    if (command.name !== undefined && command.name.trim().length === 0) {
      return Result.fail('Contact name cannot be empty');
    }

    const contact = await this.prisma.contact.update({
      where: { id: command.contactId },
      data: {
        ...(command.name !== undefined && { name: command.name.trim() }),
        ...(command.email !== undefined && { email: command.email?.trim() || null }),
        ...(command.phone !== undefined && { phone: command.phone?.trim() || null }),
        ...(command.company !== undefined && { company: command.company?.trim() || null }),
        ...(command.notes !== undefined && { notes: command.notes?.trim() || null }),
        ...(command.tags !== undefined && { tags: command.tags }),
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
