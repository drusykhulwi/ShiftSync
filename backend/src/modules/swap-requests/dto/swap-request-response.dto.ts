// backend/src/modules/swap-requests/dto/swap-request-response.dto.ts
import { Expose, Transform } from 'class-transformer';
import { SwapRequestStatus, SwapRequestType } from '@prisma/client';

export class SwapRequestResponseDto {
  @Expose()
  id: string;

  @Expose()
  shiftId: string;

  @Expose()
  requesterId: string;

  @Expose()
  responderId?: string | null;

  @Expose()
  status: SwapRequestStatus;

  @Expose()
  type: SwapRequestType;

  @Expose()
  expiresAt?: Date | null;

  @Expose()
  resolvedAt?: Date | null;

  @Expose()
  resolvedBy?: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  shift?: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    location: {
      id: string;
      name: string;
    };
  };

  @Expose()
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @Expose()
  responder?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;

  @Expose()
  @Transform(({ value }) => value ?? 0)
  timeUntilExpiry?: number; // in hours

  constructor(partial: Partial<SwapRequestResponseDto>) {
    Object.assign(this, partial);
  }
}