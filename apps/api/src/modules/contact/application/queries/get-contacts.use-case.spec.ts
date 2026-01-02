import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

import { GetContactsUseCase } from './get-contacts.use-case';

describe('GetContactsUseCase', () => {
  let useCase: GetContactsUseCase;

  const mockPrismaService = {
    contact: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetContactsUseCase,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    useCase = module.get<GetContactsUseCase>(GetContactsUseCase);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const workspaceId = 'workspace-123';
    const mockContacts = [
      {
        id: 'contact-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+33612345678',
        company: 'Acme Inc',
        tags: ['client'],
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
      {
        id: 'contact-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: null,
        company: 'Tech Corp',
        tags: ['prospect'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    it('should return paginated contacts', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue(mockContacts);
      mockPrismaService.contact.count.mockResolvedValue(2);

      const result = await useCase.execute({ workspaceId });

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should apply search filter', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([mockContacts[0]]);
      mockPrismaService.contact.count.mockResolvedValue(1);

      await useCase.execute({ workspaceId, search: 'john' });

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId,
            OR: expect.arrayContaining([
              { name: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } },
              { company: { contains: 'john', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should apply tags filter', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([mockContacts[0]]);
      mockPrismaService.contact.count.mockResolvedValue(1);

      await useCase.execute({ workspaceId, tags: ['client'] });

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId,
            tags: { hasEvery: ['client'] },
          }),
        })
      );
    });

    it('should apply multiple tags filter', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([]);
      mockPrismaService.contact.count.mockResolvedValue(0);

      await useCase.execute({ workspaceId, tags: ['client', 'vip'] });

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { hasEvery: ['client', 'vip'] },
          }),
        })
      );
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue(mockContacts);
      mockPrismaService.contact.count.mockResolvedValue(50);

      const result = await useCase.execute({ workspaceId, page: 2, limit: 10 });

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
    });

    it('should limit max results to 100', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([]);
      mockPrismaService.contact.count.mockResolvedValue(0);

      await useCase.execute({ workspaceId, limit: 500 });

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should order by createdAt desc', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue(mockContacts);
      mockPrismaService.contact.count.mockResolvedValue(2);

      await useCase.execute({ workspaceId });

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should not apply tags filter when empty array', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue(mockContacts);
      mockPrismaService.contact.count.mockResolvedValue(2);

      await useCase.execute({ workspaceId, tags: [] });

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            workspaceId,
          },
        })
      );
    });
  });

  describe('getAllTags', () => {
    const workspaceId = 'workspace-123';

    it('should return all unique tags sorted', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([
        { tags: ['client', 'vip'] },
        { tags: ['prospect', 'client'] },
        { tags: ['lead'] },
      ]);

      const result = await useCase.getAllTags(workspaceId);

      expect(result).toEqual(['client', 'lead', 'prospect', 'vip']);
    });

    it('should return empty array when no contacts', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([]);

      const result = await useCase.getAllTags(workspaceId);

      expect(result).toEqual([]);
    });

    it('should return empty array when contacts have no tags', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([
        { tags: [] },
        { tags: [] },
      ]);

      const result = await useCase.getAllTags(workspaceId);

      expect(result).toEqual([]);
    });
  });
});
