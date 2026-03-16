// backend/src/modules/audit/dto/audit-export.dto.ts
import { IsString, IsEnum, IsOptional, IsDate, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction } from '@prisma/client';

export class AuditExportDto {
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsString()
  @IsOptional()
  actorId?: string;

  @IsEnum(AuditAction)
  @IsOptional()
  action?: AuditAction;

  @IsString()
  @IsOptional()
  entityType?: string;

  @IsString()
  @IsOptional()
  entityId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fields?: string[];

  @IsString()
  @IsOptional()
  format?: 'json' | 'csv' = 'json';
}