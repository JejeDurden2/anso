import { Module } from '@nestjs/common';

import { BillingModule } from '../billing/billing.module';

import { CreateContactUseCase } from './application/commands/create-contact.use-case';
import { DeleteContactUseCase } from './application/commands/delete-contact.use-case';
import { UpdateContactUseCase } from './application/commands/update-contact.use-case';
import { GetContactByIdUseCase } from './application/queries/get-contact-by-id.use-case';
import { GetContactsUseCase } from './application/queries/get-contacts.use-case';
import { ContactController } from './infrastructure/http/contact.controller';


@Module({
  imports: [BillingModule],
  controllers: [ContactController],
  providers: [
    GetContactsUseCase,
    GetContactByIdUseCase,
    CreateContactUseCase,
    UpdateContactUseCase,
    DeleteContactUseCase,
  ],
})
export class ContactModule {}
