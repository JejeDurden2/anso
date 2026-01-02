import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

interface ContactDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface GetContactsQuery {
  workspaceId: string;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

interface PaginatedResult {
  data: ContactDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class GetContactsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetContactsQuery): Promise<PaginatedResult> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      workspaceId: query.workspaceId,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
          { company: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.tags &&
        query.tags.length > 0 && {
          tags: { hasEvery: query.tags },
        }),
    };

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      data: contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        tags: contact.tags,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllTags(workspaceId: string): Promise<string[]> {
    const contacts = await this.prisma.contact.findMany({
      where: { workspaceId },
      select: { tags: true },
    });

    const tagsSet = new Set<string>();
    contacts.forEach((contact) => {
      contact.tags.forEach((tag) => tagsSet.add(tag));
    });

    return Array.from(tagsSet).sort();
  }
}
