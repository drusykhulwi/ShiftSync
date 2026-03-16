// backend/src/modules/overtime/dto/overtime-warning.dto.ts
import { IsString, IsUUID, IsOptional, IsNumber, Min, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Expose } from 'class-transformer'; // Add this import

export enum WarningType {
  WEEKLY_HOURS = 'WEEKLY_HOURS',
  DAILY_HOURS = 'DAILY_HOURS',
  CONSECUTIVE_DAYS = 'CONSECUTIVE_DAYS',
  NO_REST_PERIOD = 'NO_REST_PERIOD',
}

export class CreateOvertimeWarningDto {
  @IsUUID()
  userId: string;

  @IsDate()
  @Type(() => Date)
  weekStart: Date;

  @IsNumber()
  @Min(0)
  totalHours: number;

  @IsEnum(WarningType)
  warningType: WarningType;

  @IsOptional()
  details?: Record<string, any>;
}

export class OvertimeWarningResponseDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  weekStart: Date;

  @Expose()
  totalHours: number;

  @Expose()
  warningType: string;

  @Expose()
  details: any;

  @Expose()
  acknowledgedAt?: Date | null;  // Allow null

  @Expose()
  acknowledgedBy?: string | null;  // Allow null

  @Expose()
  resolvedAt?: Date | null;  // Allow null

  @Expose()
  resolvedBy?: string | null;  // Allow null

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  constructor(partial: Partial<OvertimeWarningResponseDto>) {
    // Handle null values
    if (partial.acknowledgedAt === null) partial.acknowledgedAt = undefined;
    if (partial.acknowledgedBy === null) partial.acknowledgedBy = undefined;
    if (partial.resolvedAt === null) partial.resolvedAt = undefined;
    if (partial.resolvedBy === null) partial.resolvedBy = undefined;
    
    Object.assign(this, partial);
  }
}