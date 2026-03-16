// backend/src/modules/audit/dto/audit-log-response.dto.ts
import { Expose } from 'class-transformer';

export class AuditLogResponseDto {
  @Expose()
  id: string;

  @Expose()
  actorId?: string | null;

  @Expose()
  actor?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;  // Allow null

  @Expose()
  action: string;

  @Expose()
  entityType: string;

  @Expose()
  entityId: string;

  @Expose()
  beforeState?: any;

  @Expose()
  afterState?: any;

  @Expose()
  changes?: any;

  @Expose()
  ipAddress?: string | null;

  @Expose()
  userAgent?: string | null;

  @Expose()
  location?: string | null;

  @Expose()
  createdAt: Date;

  constructor(partial: Partial<AuditLogResponseDto>) {
    // Handle null values by converting to undefined if needed
    if (partial.actor === null) partial.actor = undefined;
    if (partial.actorId === null) partial.actorId = undefined;
    if (partial.ipAddress === null) partial.ipAddress = undefined;
    if (partial.userAgent === null) partial.userAgent = undefined;
    if (partial.location === null) partial.location = undefined;
    
    Object.assign(this, partial);
  }
}