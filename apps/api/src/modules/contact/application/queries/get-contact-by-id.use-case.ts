import { Injectable } from '@nestjs/common';

import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

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
export class GetContactByIdUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(workspaceId: string, contactId: string): Promise<Result<ContactDto>> {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        workspaceId,
      },
    });

    if (!contact) {
      return Result.fail('Contact not found');
    }

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
