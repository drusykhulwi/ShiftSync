// backend/src/modules/swap-requests/dto/approve-swap.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ApprovalAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ApproveSwapDto {
  @IsEnum(ApprovalAction)
  action: ApprovalAction;

  @IsString()
  @IsOptional()
  reason?: string;
}