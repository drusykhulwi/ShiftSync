// frontend/src/components/schedule/ShiftCard/ShiftActions.tsx
import React from 'react';
import { Shift } from '../../../types/shift.types';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';

interface ShiftActionsProps {
  shift: Shift;
  isOpen: boolean;
  onClose: () => void;
  onPublish?: (shift: Shift) => void;
  onCancel?: (shift: Shift) => void;
  onDuplicate?: (shift: Shift) => void;
}

export const ShiftActions: React.FC<ShiftActionsProps> = ({
  shift,
  isOpen,
  onClose,
  onPublish,
  onCancel,
  onDuplicate,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Shift Actions">
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">{shift.title}</h4>
          <p className="text-sm text-gray-600">
            {new Date(shift.startTime).toLocaleString()} - {new Date(shift.endTime).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {shift.status === 'DRAFT' && (
            <Button
              variant="primary"
              onClick={() => {
                onPublish?.(shift);
                onClose();
              }}
            >
              Publish
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              onDuplicate?.(shift);
              onClose();
            }}
          >
            Duplicate
          </Button>
          {shift.status !== 'CANCELLED' && shift.status !== 'COMPLETED' && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => {
                onCancel?.(shift);
                onClose();
              }}
            >
              Cancel Shift
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};