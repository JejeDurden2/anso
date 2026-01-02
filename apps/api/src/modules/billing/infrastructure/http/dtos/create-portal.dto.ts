import { IsUrl } from 'class-validator';

export class CreatePortalDto {
  @IsUrl({}, { message: 'Return URL must be a valid URL' })
  returnUrl!: string;
}
