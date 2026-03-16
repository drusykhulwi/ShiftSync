// backend/src/modules/notifications/dto/update-preferences.dto.ts
import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @IsBoolean()
  @IsOptional()
  inApp?: boolean;

  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @IsBoolean()
  @IsOptional()
  push?: boolean;

  @IsBoolean()
  @IsOptional()
  digest?: boolean;

  @IsObject()
  @IsOptional()
  types?: Record<string, boolean>; // Specific notification type preferences
}