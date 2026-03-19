// frontend/src/components/swap-requests/AvailableShifts/AvailableShifts.tsx
import React, { useState, useEffect } from 'react';
import { ShiftPickup } from './ShiftPickup';
import { swapRequestsService } from '../../../services/api/swap-requests.service';
import { useAuth } from '../../../hooks/useAuth';

interface AvailableShiftsProps {
  onPickup: (shiftId: string) => Promise<void>;
}

export const AvailableShifts: React.FC<AvailableShiftsProps> = ({ onPickup }) => {
  const [shifts, setShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchAvailableShifts();
  }, []);

  const fetchAvailableShifts = async () => {
    setIsLoading(true);
    try {
      // Don't filter by location/skill for staff — just show all available drops
      // Managers/admins can see everything; staff see what's available to them
      const response = await swapRequestsService.getAvailableDrops({});
      setShifts((response as any).data?.data || (response as any).data || []);
    } catch (error) {
      console.error('Failed to fetch available shifts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">📭</p>
          <p>No shifts available for pickup</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shifts.map((item) => (
            <ShiftPickup
              key={item.shift?.id || item.id}
              shift={item.shift || item}
              expiresAt={item.expiresAt}
              onPickup={onPickup}
            />
          ))}
        </div>
      )}
    </div>
  );
};