// frontend/src/types/swap-request.types.ts
export type SwapRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type SwapRequestType = 'SWAP' | 'DROP';

export interface SwapRequest {
  id: string;
  shiftId: string;
  requesterId: string;
  responderId?: string;
  status: SwapRequestStatus;
  type: SwapRequestType;
  expiresAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
  
  shift?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    location: {
      id: string;
      name: string;
    };
  };
  
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  
  responder?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  
  timeUntilExpiry?: number;
}

export interface CreateSwapRequestDto {
  shiftId: string;
  type: SwapRequestType;
  responderId?: string;
}

export interface RespondSwapDto {
  response: 'ACCEPT' | 'DECLINE';
  message?: string;
}

export interface ApproveSwapDto {
  action: 'APPROVE' | 'REJECT';
  reason?: string;
}