// backend/src/modules/skills/dto/certification-response.dto.ts
import { Expose } from 'class-transformer';

export class CertificationResponseDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  skillId: string;

  @Expose()
  locationId: string;

  @Expose()
  certifiedAt: Date;

  @Expose()
  expiresAt?: Date | null;

  @Expose()
  isActive: boolean;

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

  @Expose()
  skill?: {
    id: string;
    name: string;
    category: string | null;
  };

  @Expose()
  location?: {
    id: string;
    name: string;
    city: string;
    state: string;
  };

  constructor(partial: Partial<CertificationResponseDto>) {
    Object.assign(this, partial);
  }
}