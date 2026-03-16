// backend/src/modules/swap-requests/dto/create-swap-request.dto.ts
import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { SwapRequestType } from '@prisma/client';

export class CreateSwapRequestDto {
  @IsUUID()
  shiftId: string;

  @IsEnum(SwapRequestType)
  type: SwapRequestType;

  @IsUUID()
  @IsOptional()
  responderId?: string; // Required for SWAP type, null for DROP
}

export class CreateDropRequestDto {
  @IsUUID()
  shiftId: string;
}