import { IsString, IsNotEmpty, IsOptional, IsNumber, MaxLength, Min } from 'class-validator';

export class CreateDealDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  stageId!: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;
}
