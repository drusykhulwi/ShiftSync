// frontend/src/components/dashboard/OnDutyWidget.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { shiftsService } from '../../services/api/shifts.service';

interface OnDutyStaff {
  id: string;
  name: string;
  role: string;
  timeLeft: string;
}

interface OnDutyWidgetProps {
  locationId?: string;
}

export const OnDutyWidget: React.FC<OnDutyWidgetProps> = ({ locationId }) => {
  const [onDuty, setOnDuty] = useState<OnDutyStaff[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchOnDuty();
  }, [locationId]);

  const fetchOnDuty = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const response = await shiftsService.getShifts({
        locationId,
        status: 'PUBLISHED',
        startDate: new Date(now.setHours(0, 0, 0, 0)).toISOString(),
        endDate: new Date(now.setHours(23, 59, 59, 999)).toISOString(),
      });

      const shifts = (response as any).data?.data || (response as any).data || [];
      const currentTime = new Date();

      // Find shifts currently in progress and extract assigned staff
      const staffOnDuty: OnDutyStaff[] = [];
      shifts.forEach((shift: any) => {
        const start = new Date(shift.startTime);
        const end = new Date(shift.endTime);
        if (currentTime >= start && currentTime <= end) {
          shift.requirements?.forEach((req: any) => {
            req.assignments?.forEach((assignment: any) => {
              if (assignment.user) {
                const hoursLeft = (end.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
                staffOnDuty.push({
                  id: assignment.user.id,
                  name: `${assignment.user.firstName} ${assignment.user.lastName}`,
                  role: req.skill?.name || 'Staff',
                  timeLeft: hoursLeft < 1
                    ? `${Math.ceil(hoursLeft * 60)}m`
                    : `${Math.ceil(hoursLeft)}h`,
                });
              }
            });
          });
        }
      });

      setOnDuty(staffOnDuty);
    } catch (error) {
      console.error('Failed to fetch on-duty staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Currently On Duty</h2>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
        </div>
      ) : onDuty.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <p className="text-3xl mb-2">👥</p>
          <p className="text-sm">No staff currently on duty</p>
        </div>
      ) : (
        <div className="space-y-4">
          {onDuty.map((staff) => (
            <div key={staff.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-secondary-500 flex items-center justify-center text-white font-bold text-sm">
                  {staff.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                  <p className="text-xs text-gray-500">{staff.role}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{staff.timeLeft} left</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};