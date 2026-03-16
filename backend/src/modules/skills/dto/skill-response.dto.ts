// backend/src/modules/skills/dto/skill-response.dto.ts
import { Expose } from 'class-transformer';

export class SkillResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string | null;

  @Expose()
  category?: string | null;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  certificationCount?: number;

  constructor(partial: Partial<SkillResponseDto>) {
    Object.assign(this, partial);
  }
}