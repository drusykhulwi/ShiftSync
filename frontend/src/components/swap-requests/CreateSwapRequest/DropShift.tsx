// frontend/src/components/swap-requests/CreateSwapRequest/DropShift.tsx
import React, { useState } from 'react';
import { Shift } from '../../../types/shift.types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { format } from 'date-fns';

interface DropShiftProps {
  shift: Shift;
  onSubmit: (shiftId: string) => Promise<void>;
  onCancel: () => void;
}

export const DropShift: React.FC<DropShiftProps> = ({
  shift,
  onSubmit,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSubmit(shift.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-medium text-gray-900 mb-2">{shift.title}</h3>
        <p className="text-sm text-gray-600">
          {format(new Date(shift.startTime), 'EEEE, MMMM d, yyyy')}
        </p>
        <p className="text-sm text-gray-600">
          {format(new Date(shift.startTime), 'h:mm a')} - {format(new Date(shift.endTime), 'h:mm a')}
        </p>
        <p className="text-xs text-primary-500 mt-2">{shift.location?.name}</p>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ This shift will be available for any qualified staff member to pick up. 
          It will expire 24 hours before the shift starts.
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} isLoading={isLoading}>
          Drop Shift
        </Button>
      </div>
    </div>
  );
};