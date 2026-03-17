// frontend/src/components/schedule/ShiftCard/ShiftCard.tsx
import React from 'react';
import { format } from 'date-fns';
import { Shift } from '../../../types/shift.types';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';

interface ShiftCardProps {
  shift: Shift;
  onEdit?: (shift: Shift) => void;
  onAssign?: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
}

export const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  onEdit,
  onAssign,
  onDelete,
}) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'success';
      case 'DRAFT':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const totalSpots = shift.requirements?.reduce((sum, r) => sum + r.headcount, 0) || 0;
  const filledSpots = shift.assignedCount || 0;
  const openSpots = shift.openSpots || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{shift.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {shift.location?.name}
          </p>
        </div>
        <Badge variant={getStatusVariant(shift.status)}>
          {shift.status}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-5">📅</span>
          <span>{format(new Date(shift.startTime), 'EEE, MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-5">⏰</span>
          <span>
            {format(new Date(shift.startTime), 'h:mm a')} - {format(new Date(shift.endTime), 'h:mm a')}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-5">👥</span>
          <span>{filledSpots} / {totalSpots} filled</span>
        </div>
      </div>

      {shift.requirements && shift.requirements.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Required Skills:</p>
          <div className="space-y-1">
            {shift.requirements.map((req, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600">{req.skill.name}</span>
                <span className="font-medium">
                  {req.assignments?.length || 0}/{req.headcount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-100">
        {shift.status === 'DRAFT' && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit?.(shift)}
              className="flex-1"
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onAssign?.(shift)}
              className="flex-1"
            >
              Assign
            </Button>
          </>
        )}
        {shift.status === 'PUBLISHED' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onAssign?.(shift)}
            className="flex-1"
          >
            Assign Staff
          </Button>
        )}
        {openSpots > 0 && shift.status === 'PUBLISHED' && (
          <Badge variant="warning" size="sm">
            {openSpots} open {openSpots === 1 ? 'spot' : 'spots'}
          </Badge>
        )}
      </div>
    </div>
  );
};