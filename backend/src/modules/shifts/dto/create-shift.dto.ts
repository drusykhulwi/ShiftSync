// backend/src/modules/shifts/dto/create-shift.dto.ts
import { 
  IsString, 
  IsDate, 
  IsEnum, 
  IsOptional, 
  IsArray, 
  ValidateNested,
  IsNumber,
  Min 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ShiftStatus } from '@prisma/client';

class ShiftRequirementDto {
  @IsString()
  skillId: string;

  @IsNumber()
  @Min(1)
  headcount: number;

  @IsNumber()
  @IsOptional()
  priority?: number;
}

export class CreateShiftDto {
  @IsString()
  locationId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @IsEnum(ShiftStatus)
  @IsOptional()
  status?: ShiftStatus = ShiftStatus.DRAFT;

  @IsNumber()
  @IsOptional()
  @Min(1)
  cutoffHours?: number = 48;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftRequirementDto)
  requirements: ShiftRequirementDto[];
}