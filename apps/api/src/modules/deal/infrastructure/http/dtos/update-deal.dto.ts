import { IsString, IsOptional, IsNumber, MaxLength, Min } from 'class-validator';

export class UpdateDealDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  stageId?: string;

  @IsOptional()
  @IsString()
  contactId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number | null;
}
