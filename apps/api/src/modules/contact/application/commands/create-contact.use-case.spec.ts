import { Test, TestingModule } from '@nestjs/testing';

import { PlanLimitsService } from '@/modules/billing/application/services/plan-limits.service';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { TracingService } from '@/shared/infrastructure/tracing/tracing.service';

import { CreateContactUseCase } from './create-contact.use-case';

describe('CreateContactUseCase', () => {
  let useCase: CreateContactUseCase;

  const mockPrismaService = {
    contact: {
      create: jest.fn(),
    },
  };

  const mockPlanLimitsService = {
    canAddContact: jest.fn(),
  };

  const mockTracingService = {
    withSpan: jest.fn().mockImplementation((_name, fn) => fn({ setAttributes: jest.fn() })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateContactUseCase,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PlanLimitsService,
          useValue: mockPlanLimitsService,
        },
        {
          provide: TracingService,
          useValue: mockTracingService,
        },
      ],
    }).compile();

    useCase = module.get<CreateContactUseCase>(CreateContactUseCase);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const workspaceId = 'workspace-123';
    const validCommand = {
      workspaceId,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+33612345678',
      company: 'Acme Inc',
      notes: 'Test notes',
      tags: ['client', 'vip'],
    };

    it('should create a contact successfully', async () => {
      const createdContact = {
        id: 'contact-123',
        ...validCommand,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPlanLimitsService.canAddContact.mockResolvedValue({
        allowed: true,
        currentCount: 10,
        limit: null,
        remaining: null,
      });
      mockPrismaService.contact.create.mockResolvedValue(createdContact);

      const result = await useCase.execute(validCommand);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({
        id: createdContact.id,
        name: createdContact.name,
        email: createdContact.email,
        phone: createdContact.phone,
        company: createdContact.company,
        notes: createdContact.notes,
        tags: createdContact.tags,
        createdAt: createdContact.createdAt,
        updatedAt: createdContact.updatedAt,
      });
    });

    it('should fail when name is empty', async () => {
      const result = await useCase.execute({
        ...validCommand,
        name: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Contact name is required');
    });

    it('should fail when name is only whitespace', async () => {
      const result = await useCase.execute({
        ...validCommand,
        name: '   ',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Contact name is required');
    });

    it('should fail when plan limit not allowed', async () => {
      mockPlanLimitsService.canAddContact.mockResolvedValue({
        allowed: false,
        currentCount: 50,
        limit: 50,
        remaining: 0,
      });

      const result = await useCase.execute(validCommand);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Vous avez atteint la limite de 50 contacts');
    });

    it('should allow creation when under free plan limit', async () => {
      const createdContact = {
        id: 'contact-123',
        ...validCommand,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPlanLimitsService.canAddContact.mockResolvedValue({
        allowed: true,
        currentCount: 49,
        limit: 50,
        remaining: 1,
      });
      mockPrismaService.contact.create.mockResolvedValue(createdContact);

      const result = await useCase.execute(validCommand);

      expect(result.isSuccess).toBe(true);
    });

    it('should trim whitespace from fields', async () => {
      const createdContact = {
        id: 'contact-123',
        workspaceId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+33612345678',
        company: 'Acme Inc',
        notes: 'Test notes',
        tags: ['client'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPlanLimitsService.canAddContact.mockResolvedValue({
        allowed: true,
        currentCount: 10,
        limit: null,
        remaining: null,
      });
      mockPrismaService.contact.create.mockResolvedValue(createdContact);

      await useCase.execute({
        workspaceId,
        name: '  John Doe  ',
        email: '  john@example.com  ',
        phone: '  +33612345678  ',
        company: '  Acme Inc  ',
        notes: '  Test notes  ',
        tags: ['client'],
      });

      expect(mockPrismaService.contact.create).toHaveBeenCalledWith({
        data: {
          workspaceId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+33612345678',
          company: 'Acme Inc',
          notes: 'Test notes',
          tags: ['client'],
        },
      });
    });

    it('should handle null optional fields', async () => {
      const createdContact = {
        id: 'contact-123',
        workspaceId,
        name: 'John Doe',
        email: null,
        phone: null,
        company: null,
        notes: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPlanLimitsService.canAddContact.mockResolvedValue({
        allowed: true,
        currentCount: 10,
        limit: null,
        remaining: null,
      });
      mockPrismaService.contact.create.mockResolvedValue(createdContact);

      const result = await useCase.execute({
        workspaceId,
        name: 'John Doe',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.email).toBeNull();
      expect(result.value.phone).toBeNull();
      expect(result.value.company).toBeNull();
      expect(result.value.notes).toBeNull();
      expect(result.value.tags).toEqual([]);
    });
  });
});
