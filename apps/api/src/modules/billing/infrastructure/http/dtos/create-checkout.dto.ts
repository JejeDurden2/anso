import { Plan } from '@prisma/client';
import { IsEnum, IsUrl } from 'class-validator';

export class CreateCheckoutDto {
  @IsEnum(Plan, { message: 'Plan must be SOLO or TEAM' })
  plan!: Plan;

  @IsUrl({}, { message: 'Success URL must be a valid URL' })
  successUrl!: string;

  @IsUrl({}, { message: 'Cancel URL must be a valid URL' })
  cancelUrl!: string;
}
