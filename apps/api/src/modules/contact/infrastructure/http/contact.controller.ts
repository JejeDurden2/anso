import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard, WorkspaceGuard } from '@/shared/infrastructure/guards';

import { CreateContactUseCase } from '../../application/commands/create-contact.use-case';
import { DeleteContactUseCase } from '../../application/commands/delete-contact.use-case';
import { ImportContactsUseCase } from '../../application/commands/import-contacts.use-case';
import { UpdateContactUseCase } from '../../application/commands/update-contact.use-case';
import { GetContactByIdUseCase } from '../../application/queries/get-contact-by-id.use-case';
import { GetContactsUseCase } from '../../application/queries/get-contacts.use-case';

import { CreateContactDto } from './dtos/create-contact.dto';
import { UpdateContactDto } from './dtos/update-contact.dto';

@Controller('workspaces/:wid/contacts')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ContactController {
  constructor(
    private readonly getContactsUseCase: GetContactsUseCase,
    private readonly getContactByIdUseCase: GetContactByIdUseCase,
    private readonly createContactUseCase: CreateContactUseCase,
    private readonly updateContactUseCase: UpdateContactUseCase,
    private readonly deleteContactUseCase: DeleteContactUseCase,
    private readonly importContactsUseCase: ImportContactsUseCase
  ) {}

  @Get()
  async getContacts(
    @Param('wid') workspaceId: string,
    @Query('search') search?: string,
    @Query('tags') tagsQuery?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<{ success: boolean; data: unknown[]; pagination: unknown }> {
    const tags = tagsQuery ? tagsQuery.split(',').filter(Boolean) : undefined;

    const result = await this.getContactsUseCase.execute({
      workspaceId,
      search,
      tags,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('tags')
  async getAllTags(
    @Param('wid') workspaceId: string
  ): Promise<{ success: boolean; data: string[] }> {
    const tags = await this.getContactsUseCase.getAllTags(workspaceId);

    return {
      success: true,
      data: tags,
    };
  }

  @Get(':id')
  async getContactById(
    @Param('wid') workspaceId: string,
    @Param('id') contactId: string
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.getContactByIdUseCase.execute(workspaceId, contactId);

    if (result.isFailure) {
      throw new NotFoundException(result.error);
    }

    return {
      success: true,
      data: result.value,
    };
  }

  @Post()
  async createContact(
    @Param('wid') workspaceId: string,
    @Body() dto: CreateContactDto
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.createContactUseCase.execute({
      workspaceId,
      ...dto,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: result.value,
    };
  }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
      fileFilter: (_req, file, callback) => {
        if (!file.originalname.match(/\.(csv)$/i)) {
          return callback(new BadRequestException('Seuls les fichiers CSV sont acceptés'), false);
        }
        callback(null, true);
      },
    })
  )
  async importContacts(
    @Param('wid') workspaceId: string,
    @UploadedFile() file: Express.Multer.File
  ): Promise<{
    success: boolean;
    data: {
      imported: unknown[];
      errors: unknown[];
      total: number;
    };
  }> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const csvContent = file.buffer.toString('utf-8');
    const result = await this.importContactsUseCase.execute({
      workspaceId,
      csvContent,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: result.value,
    };
  }

  @Patch(':id')
  async updateContact(
    @Param('wid') workspaceId: string,
    @Param('id') contactId: string,
    @Body() dto: UpdateContactDto
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.updateContactUseCase.execute({
      workspaceId,
      contactId,
      ...dto,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: result.value,
    };
  }

  @Delete(':id')
  async deleteContact(
    @Param('wid') workspaceId: string,
    @Param('id') contactId: string
  ): Promise<{ success: boolean; data: null }> {
    const result = await this.deleteContactUseCase.execute(workspaceId, contactId);

    if (result.isFailure) {
      throw new NotFoundException(result.error);
    }

    return {
      success: true,
      data: null,
    };
  }
}
