// frontend/src/components/dashboard/UpcomingShifts.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { format } from 'date-fns';
import { shiftsService } from '../../services/api/shifts.service';
import { useRouter } from 'next/router';

interface UpcomingShiftsProps {
  locationId?: string;
  userId?: string;
}

const isUserAssigned = (shift: any, userId: string) =>
  shift.requirements?.some((req: any) =>
    req.assignments?.some(
      (a: any) => a.userId === userId || a.user?.id === userId
    )
  );

export const UpcomingShifts: React.FC<UpcomingShiftsProps> = ({ locationId, userId }) => {
  const [shifts, setShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUpcomingShifts();
  }, [locationId, userId]);

  const fetchUpcomingShifts = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const response = await shiftsService.getShifts({
        locationId,
        // For staff (userId provided): show all statuses including DRAFT
        // For manager/admin (no userId): only PUBLISHED
        ...(userId ? {} : { status: 'PUBLISHED' }),
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        limit: 50,
      });

      let allShifts = (response as any).data?.data || (response as any).data || [];

      if (userId) {
        allShifts = allShifts.filter((s: any) => isUserAssigned(s, userId));
      }

      setShifts(allShifts.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch upcoming shifts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const schedulePath = userId ? '/staff/schedule' : '/schedule';

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Shifts</h2>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
        </div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-sm">No upcoming shifts</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shifts.map((shift) => (
            <div key={shift.id} className="border-b last:border-0 pb-4 last:pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{shift.title}</p>
                    {shift.status === 'DRAFT' && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(shift.startTime), 'EEE, MMM d')} •{' '}
                    {format(new Date(shift.startTime), 'h:mm a')} -{' '}
                    {format(new Date(shift.endTime), 'h:mm a')}
                  </p>
                  <p className="text-xs text-primary-500 mt-1">
                    {shift.location?.name || ''}
                  </p>
                </div>
                <button
                  onClick={() => router.push(schedulePath)}
                  className="text-sm text-primary-500 hover:text-primary-600 flex-shrink-0 ml-2"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};