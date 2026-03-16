// backend/src/modules/audit/dto/create-audit-log.dto.ts
import { IsString, IsEnum, IsOptional, IsObject, IsUUID } from 'class-validator';
import { AuditAction } from '@prisma/client';

export class CreateAuditLogDto {
  @IsString()
  @IsOptional()
  actorId?: string;

  @IsEnum(AuditAction)
  action: AuditAction;

  @IsString()
  entityType: string;

  @IsString()
  entityId: string;

  @IsObject()
  @IsOptional()
  beforeState?: Record<string, any>;

  @IsObject()
  @IsOptional()
  afterState?: Record<string, any>;

  @IsObject()
  @IsOptional()
  changes?: Record<string, any>;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  location?: string;
}