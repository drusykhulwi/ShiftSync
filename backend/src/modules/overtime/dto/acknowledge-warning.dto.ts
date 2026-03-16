// backend/src/modules/overtime/dto/acknowledge-warning.dto.ts
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class AcknowledgeWarningDto {
  @IsUUID()
  warningId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ResolveWarningDto {
  @IsUUID()
  warningId: string;

  @IsString()
  @IsOptional()
  resolution?: string;
}