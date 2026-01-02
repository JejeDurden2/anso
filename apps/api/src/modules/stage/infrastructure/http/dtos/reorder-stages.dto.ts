import { IsArray, ValidateNested, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class StagePositionDto {
  @IsString()
  id!: string;

  @IsNumber()
  @Min(0)
  position!: number;
}

export class ReorderStagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StagePositionDto)
  stages!: StagePositionDto[];
}
