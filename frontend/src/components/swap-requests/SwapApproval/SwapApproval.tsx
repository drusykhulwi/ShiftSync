// frontend/src/components/swap-requests/SwapApproval/SwapApproval.tsx
import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { SwapRequest } from '../../../types/swap-request.types';

interface SwapApprovalProps {
  isOpen: boolean;
  onClose: () => void;
  request: SwapRequest;
  onApprove: (requestId: string, reason?: string) => Promise<void>;
  onReject: (requestId: string, reason?: string) => Promise<void>;
}

export const SwapApproval: React.FC<SwapApprovalProps> = ({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
}) => {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await onApprove(request.id, reason);
      onClose();
    } catch (error) {
      console.error('Failed to approve swap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await onReject(request.id, reason);
      onClose();
    } catch (error) {
      console.error('Failed to reject swap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Swap Request" size="md">
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-medium text-gray-900">{request.shift?.title}</p>
          <p className="text-sm text-gray-600">
            {new Date(request.shift?.startTime || '').toLocaleString()}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Requester</p>
              <p className="text-sm font-medium">
                {request.requester?.firstName} {request.requester?.lastName}
              </p>
            </div>
            <span className="text-gray-400">⟷</span>
            <div className="text-right">
              <p className="text-xs text-gray-500">Responder</p>
              <p className="text-sm font-medium">
                {request.responder?.firstName} {request.responder?.lastName}
              </p>
            </div>
          </div>
        </div>

        <Input
          label="Reason / Notes (Optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Add any notes about your decision..."
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={handleReject}
            isLoading={isLoading}
            className="text-red-500 hover:text-red-600"
          >
            Reject
          </Button>
          <Button
            variant="primary"
            onClick={handleApprove}
            isLoading={isLoading}
          >
            Approve Swap
          </Button>
        </div>
      </div>
    </Modal>
  );
};