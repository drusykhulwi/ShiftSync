// frontend/src/components/swap-requests/SwapRequestCard/SwapStatus.tsx
import React from 'react';
import { Badge } from '../../common/Badge';
import { SwapRequestStatus } from '../../../types/swap-request.types';

interface SwapStatusProps {
  status: SwapRequestStatus;
}

export const SwapStatus: React.FC<SwapStatusProps> = ({ status }) => {
  const getStatusVariant = (status: SwapRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACCEPTED':
        return 'info';
      case 'APPROVED':
        return 'success';
      case 'DECLINED':
      case 'REJECTED':
      case 'CANCELLED':
      case 'EXPIRED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: SwapRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'ACCEPTED':
        return 'Accepted - Awaiting Approval';
      case 'APPROVED':
        return 'Approved';
      case 'DECLINED':
        return 'Declined';
      case 'REJECTED':
        return 'Rejected';
      case 'CANCELLED':
        return 'Cancelled';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status;
    }
  };

  return (
    <Badge variant={getStatusVariant(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
};