import { Test, TestingModule } from '@nestjs/testing';

import { DeleteContactUseCase } from './delete-contact.use-case';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

describe('DeleteContactUseCase', () => {
  let useCase: DeleteContactUseCase;

  const mockPrismaService = {
    contact: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteContactUseCase,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    useCase = module.get<DeleteContactUseCase>(DeleteContactUseCase);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const workspaceId = 'workspace-123';
    const contactId = 'contact-123';
    const existingContact = {
      id: contactId,
      workspaceId,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should delete a contact successfully', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(existingContact);
      mockPrismaService.contact.delete.mockResolvedValue(existingContact);

      const result = await useCase.execute(workspaceId, contactId);

      expect(result.isSuccess).toBe(true);
      expect(mockPrismaService.contact.delete).toHaveBeenCalledWith({
        where: { id: contactId },
      });
    });

    it('should fail when contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      const result = await useCase.execute(workspaceId, contactId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Contact not found');
      expect(mockPrismaService.contact.delete).not.toHaveBeenCalled();
    });

    it('should fail when contact belongs to different workspace', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      const result = await useCase.execute('different-workspace', contactId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Contact not found');
    });

    it('should verify contact ownership before deletion', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(existingContact);
      mockPrismaService.contact.delete.mockResolvedValue(existingContact);

      await useCase.execute(workspaceId, contactId);

      expect(mockPrismaService.contact.findFirst).toHaveBeenCalledWith({
        where: {
          id: contactId,
          workspaceId,
        },
      });
    });
  });
});
