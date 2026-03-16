// backend/src/modules/shifts/dto/assign-staff.dto.ts
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class AssignStaffDto {
  @IsString()
  userId: string;

  @IsString()
  requirementId: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = true;

  @IsString()
  @IsOptional()
  overrideReason?: string; // For overtime overrides
}