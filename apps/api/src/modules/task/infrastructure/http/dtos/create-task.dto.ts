import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  dealId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  source?: 'manual' | 'automation';

  @IsOptional()
  @IsString()
  automationRuleId?: string;
}
