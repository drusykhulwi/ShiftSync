// backend/src/modules/skills/dto/create-certification.dto.ts
import { IsString, IsOptional, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCertificationDto {
  @IsString()
  userId: string;

  @IsString()
  skillId: string;

  @IsString()
  locationId: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsString()
  @IsOptional()
  notes?: string;
}