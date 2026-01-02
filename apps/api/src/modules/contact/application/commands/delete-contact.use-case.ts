import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { Result } from '@/shared/domain';

@Injectable()
export class DeleteContactUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(workspaceId: string, contactId: string): Promise<Result<void>> {
    const existingContact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        workspaceId,
      },
    });

    if (!existingContact) {
      return Result.fail('Contact not found');
    }

    await this.prisma.contact.delete({
      where: { id: contactId },
    });

    return Result.ok(undefined as void);
  }
}
