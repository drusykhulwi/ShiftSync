// backend/src/modules/skills/dto/create-skill.dto.ts
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateSkillDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}