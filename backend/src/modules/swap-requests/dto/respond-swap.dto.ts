// backend/src/modules/swap-requests/dto/respond-swap.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum SwapResponse {
  ACCEPT = 'ACCEPT',
  DECLINE = 'DECLINE',
}

export class RespondSwapDto {
  @IsEnum(SwapResponse)
  response: SwapResponse;

  @IsString()
  @IsOptional()
  message?: string;
}