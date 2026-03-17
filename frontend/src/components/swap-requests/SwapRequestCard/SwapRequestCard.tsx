// frontend/src/components/swap-requests/SwapRequestCard/SwapRequestCard.tsx
import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { SwapRequest } from '../../../types/swap-request.types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { SwapStatus } from './SwapStatus';
import { Avatar } from '../../common/Avatar';

interface SwapRequestCardProps {
  request: SwapRequest;
  userRole: string;
  userId: string;
  onRespond?: (requestId: string, response: 'ACCEPT' | 'DECLINE') => void;
  onApprove?: (requestId: string, action: 'APPROVE' | 'REJECT') => void;
  onCancel?: (requestId: string) => void;
  onViewShift?: (shiftId: string) => void;
}

export const SwapRequestCard: React.FC<SwapRequestCardProps> = ({
  request,
  userRole,
  userId,
  onRespond,
  onApprove,
  onCancel,
  onViewShift,
}) => {
  const isRequester = request.requesterId === userId;
  const isResponder = request.responderId === userId;
  const isManager = userRole === 'MANAGER' || userRole === 'ADMIN';

  const canRespond = request.status === 'PENDING' && isResponder;
  const canApprove = request.status === 'ACCEPTED' && isManager;
  const canCancel = (request.status === 'PENDING' || request.status === 'ACCEPTED') && 
                    (isRequester || isManager);

  const getTypeIcon = () => {
    return request.type === 'SWAP' ? '🔄' : '📤';
  };

  const getExpiryWarning = () => {
    if (!request.expiresAt) return null;
    const hoursLeft = request.timeUntilExpiry;
    if (hoursLeft && hoursLeft < 24) {
      return <span className="text-red-500 text-xs">Expires soon!</span>;
    }
    return null;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getTypeIcon()}</span>
          <div>
            <h3 className="font-medium text-gray-900">
              {request.type === 'SWAP' ? 'Shift Swap' : 'Shift Drop'}
            </h3>
            <p className="text-sm text-gray-500">
              {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>
        <SwapStatus status={request.status} />
      </div>

      {/* Shift Details */}
      <div className="bg-gray-50 p-3 rounded-lg mb-3">
        <p className="font-medium text-gray-900">{request.shift?.title}</p>
        <p className="text-sm text-gray-600">
          {request.shift && format(new Date(request.shift.startTime), 'EEE, MMM d, yyyy')}
        </p>
        <p className="text-sm text-gray-600">
          {request.shift && (
            <>
              {format(new Date(request.shift.startTime), 'h:mm a')} - 
              {format(new Date(request.shift.endTime), 'h:mm a')}
            </>
          )}
        </p>
        <p className="text-xs text-primary-500 mt-1">{request.shift?.location.name}</p>
      </div>

      {/* People involved */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar name={`${request.requester?.firstName} ${request.requester?.lastName}`} size="sm" />
            <span className="text-sm">
              {request.requester?.firstName} {request.requester?.lastName}
              {isRequester && <span className="text-gray-500 ml-1">(You)</span>}
            </span>
          </div>
          <span className="text-xs text-gray-500">Requester</span>
        </div>

        {request.type === 'SWAP' && request.responder && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar name={`${request.responder?.firstName} ${request.responder?.lastName}`} size="sm" />
              <span className="text-sm">
                {request.responder?.firstName} {request.responder?.lastName}
                {isResponder && <span className="text-gray-500 ml-1">(You)</span>}
              </span>
            </div>
            <span className="text-xs text-gray-500">Responder</span>
          </div>
        )}
      </div>

      {/* Expiry info */}
      {request.expiresAt && (
        <div className="text-xs text-gray-500 mb-3 flex items-center justify-between">
          <span>⏰ Expires {formatDistanceToNow(new Date(request.expiresAt), { addSuffix: true })}</span>
          {getExpiryWarning()}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-100">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewShift?.(request.shiftId)}
          className="flex-1"
        >
          View Shift
        </Button>

        {canRespond && (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onRespond?.(request.id, 'ACCEPT')}
              className="flex-1"
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRespond?.(request.id, 'DECLINE')}
              className="flex-1"
            >
              Decline
            </Button>
          </>
        )}

        {canApprove && (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onApprove?.(request.id, 'APPROVE')}
              className="flex-1"
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onApprove?.(request.id, 'REJECT')}
              className="flex-1"
            >
              Reject
            </Button>
          </>
        )}

        {canCancel && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCancel?.(request.id)}
            className="text-red-500 hover:text-red-600"
          >
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
};