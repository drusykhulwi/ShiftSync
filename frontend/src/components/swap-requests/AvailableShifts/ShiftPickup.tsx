// frontend/src/components/swap-requests/AvailableShifts/ShiftPickup.tsx
import React from 'react';
import { format } from 'date-fns';
import { Shift } from '../../../types/shift.types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';

interface ShiftPickupProps {
  shift: Shift;
  expiresAt?: string; // Add optional expiresAt prop
  onPickup: (shiftId: string) => void;
}

export const ShiftPickup: React.FC<ShiftPickupProps> = ({ 
  shift, 
  expiresAt, 
  onPickup 
}) => {
  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const hours = (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hours < 1) {
      return <span className="text-red-500 text-xs">{Math.ceil(hours * 60)} minutes left</span>;
    }
    return <span className="text-gray-500 text-xs">{Math.ceil(hours)} hours left</span>;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{shift.title}</h3>
          <p className="text-sm text-gray-500">{shift.location?.name}</p>
        </div>
        <Badge variant="warning">Available</Badge>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-600">
          📅 {format(new Date(shift.startTime), 'EEEE, MMMM d, yyyy')}
        </p>
        <p className="text-sm text-gray-600">
          ⏰ {format(new Date(shift.startTime), 'h:mm a')} - {format(new Date(shift.endTime), 'h:mm a')}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {shift.requirements?.map((req, idx) => (
            <Badge key={idx} variant="info" size="sm">
              {req.skill.name}: {req.assignments?.length || 0}/{req.headcount}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-sm">
          {getTimeRemaining(expiresAt)}
        </div>
        <Button size="sm" onClick={() => onPickup(shift.id)}>
          Pick Up Shift
        </Button>
      </div>
    </Card>
  );
};