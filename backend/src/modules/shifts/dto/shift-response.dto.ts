// backend/src/modules/shifts/dto/shift-response.dto.ts
import { Expose, Transform } from 'class-transformer';
import { ShiftStatus } from '@prisma/client';

// Define a type for the raw Prisma return
export type RawShift = any; // Temporary workaround

export class ShiftResponseDto {
  @Expose()
  id: string;

  @Expose()
  locationId: string;

  @Expose()
  title: string;

  @Expose()
  @Transform(({ value }) => value ?? undefined)
  description?: string;

  @Expose()
  startTime: Date;

  @Expose()
  endTime: Date;

  @Expose()
  status: ShiftStatus;

  @Expose()
  @Transform(({ value }) => value ?? undefined)
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
  @Transform(({ value }) => {
    if (!value) return value;
    return value.map((req: any) => ({
      id: req.id,
      skill: {
        id: req.skill?.id,
        name: req.skill?.name,
        category: req.skill?.category ?? undefined
      },
      headcount: req.headcount,
      priority: req.priority,
      assignedCount: req.assignments?.length || 0,
      assignments: req.assignments?.map((assignment: any) => ({
        id: assignment.id,
        user: assignment.user ? {
          id: assignment.user.id,
          firstName: assignment.user.firstName,
          lastName: assignment.user.lastName,
        } : undefined,
        isPrimary: assignment.isPrimary,
      })) || []
    }));
  })
  requirements?: Array<{
    id: string;
    skill: {
      id: string;
      name: string;
      category?: string;
    };
    headcount: number;
    priority: number;
    assignedCount?: number;
    assignments?: Array<{
      id: string;
      user?: {
        id: string;
        firstName: string;
        lastName: string;
      };
      isPrimary: boolean;
    }>;
  }>;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.requirements) return 0;
    return obj.requirements.reduce((sum: number, req: any) => 
      sum + (req.assignments?.length || 0), 0
    );
  })
  assignedCount?: number;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.requirements) return 0;
    const totalSpots = obj.requirements.reduce((sum: number, req: any) => 
      sum + (req.headcount || 0), 0
    );
    const filledSpots = obj.requirements.reduce((sum: number, req: any) => 
      sum + (req.assignments?.length || 0), 0
    );
    return totalSpots - filledSpots;
  })
  openSpots?: number;

  constructor(partial: Partial<ShiftResponseDto>) {
    Object.assign(this, partial);
  }

  // Static method to create from raw Prisma data
  static fromRaw(raw: any): ShiftResponseDto {
    return new ShiftResponseDto(raw as Partial<ShiftResponseDto>);
  }
}