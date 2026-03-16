// backend/src/modules/shifts/dto/update-shift.dto.ts
import { 
  IsString, 
  IsDate, 
  IsEnum, 
  IsOptional, 
  IsNumber,
  Min,
  IsArray,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { ShiftStatus } from '@prisma/client';

class UpdateShiftRequirementDto {
  @IsString()
  @IsOptional()
  skillId?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  headcount?: number;

  @IsNumber()
  @IsOptional()
  priority?: number;
}

export class UpdateShiftDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startTime?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endTime?: Date;

  @IsEnum(ShiftStatus)
  @IsOptional()
  status?: ShiftStatus;

  @IsNumber()
  @IsOptional()
  @Min(1)
  cutoffHours?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateShiftRequirementDto)
  requirements?: UpdateShiftRequirementDto[];
}