import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

import { UpdateContactUseCase } from './update-contact.use-case';

describe('UpdateContactUseCase', () => {
  let useCase: UpdateContactUseCase;

  const mockPrismaService = {
    contact: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateContactUseCase,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    useCase = module.get<UpdateContactUseCase>(UpdateContactUseCase);

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
      phone: '+33612345678',
      company: 'Acme Inc',
      notes: 'Test notes',
      tags: ['client'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    it('should update a contact successfully', async () => {
      const updatedContact = {
        ...existingContact,
        name: 'Jane Doe',
        updatedAt: new Date(),
      };

      mockPrismaService.contact.findFirst.mockResolvedValue(existingContact);
      mockPrismaService.contact.update.mockResolvedValue(updatedContact);

      const result = await useCase.execute({
        workspaceId,
        contactId,
        name: 'Jane Doe',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('Jane Doe');
    });

    it('should fail when contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      const result = await useCase.execute({
        workspaceId,
        contactId,
        name: 'Jane Doe',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Contact not found');
    });

    it('should fail when name is empty string', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(existingContact);

      const result = await useCase.execute({
        workspaceId,
        contactId,
        name: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Contact name cannot be empty');
    });

    it('should fail when name is only whitespace', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(existingContact);

      const result = await useCase.execute({
        workspaceId,
        contactId,
        name: '   ',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Contact name cannot be empty');
    });

    it('should update only provided fields', async () => {
      const updatedContact = {
        ...existingContact,
        email: 'new@example.com',
        updatedAt: new Date(),
      };

      mockPrismaService.contact.findFirst.mockResolvedValue(existingContact);
      mockPrismaService.contact.update.mockResolvedValue(updatedContact);

      await useCase.execute({
        workspaceId,
        contactId,
        email: 'new@example.com',
      });

      expect(mockPrismaService.contact.update).toHaveBeenCalledWith({
        where: { id: contactId },
        data: {
          email: 'new@example.com',
        },
      });
    });

    it('should update tags', async () => {
      const updatedContact = {
        ...existingContact,
        tags: ['prospect', 'vip'],
        updatedAt: new Date(),
      };

      mockPrismaService.contact.findFirst.mockResolvedValue(existingContact);
      mockPrismaService.contact.update.mockResolvedValue(updatedContact);

      const result = await useCase.execute({
        workspaceId,
        contactId,
        tags: ['prospect', 'vip'],
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.tags).toEqual(['prospect', 'vip']);
    });

    it('should allow setting email to empty string (converts to null)', async () => {
      const updatedContact = {
        ...existingContact,
        email: null,
        updatedAt: new Date(),
      };

      mockPrismaService.contact.findFirst.mockResolvedValue(existingContact);
      mockPrismaService.contact.update.mockResolvedValue(updatedContact);

      await useCase.execute({
        workspaceId,
        contactId,
        email: '',
      });

      expect(mockPrismaService.contact.update).toHaveBeenCalledWith({
        where: { id: contactId },
        data: {
          email: null,
        },
      });
    });

    it('should verify contact belongs to workspace', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await useCase.execute({
        workspaceId: 'different-workspace',
        contactId,
        name: 'Jane Doe',
      });

      expect(mockPrismaService.contact.findFirst).toHaveBeenCalledWith({
        where: {
          id: contactId,
          workspaceId: 'different-workspace',
        },
      });
    });
  });
});
