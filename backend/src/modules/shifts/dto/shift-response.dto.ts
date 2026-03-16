// backend/src/modules/shifts/dto/shift-response.dto.ts
import { Expose, Transform } from 'class-transformer';
import { ShiftStatus } from '@prisma/client';

export class ShiftResponseDto {
  @Expose()
  id: string;

  @Expose()
  locationId: string;

  @Expose()
  title: string;

  @Expose()
  description?: string;

  @Expose()
  startTime: Date;

  @Expose()
  endTime: Date;

  @Expose()
  status: ShiftStatus;

  @Expose()
  publishedAt?: Date;

  @Expose()
  cutoffHours: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  location?: {
    id: string;
    name: string;
    timezone: string;
  };

  @Expose()
  requirements?: Array<{
    id: string;
    skill: {
      id: string;
      name: string;
      category: string;
    };
    headcount: number;
    priority: number;
    assignedCount?: number;
    assignments?: Array<{
      id: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
      };
      isPrimary: boolean;
    }>;
  }>;

  @Expose()
  @Transform(({ value }) => value ?? 0)
  assignedCount?: number;

  @Expose()
  @Transform(({ value }) => value ?? 0)
  openSpots?: number;

  constructor(partial: Partial<ShiftResponseDto>) {
    Object.assign(this, partial);
  }
}