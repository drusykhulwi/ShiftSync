import React from 'react';
import { Card } from '../common/Card';
import { format } from 'date-fns';

export const UpcomingShifts: React.FC = () => {
  // Mock data - replace with real data from API
  const shifts = [
    {
      id: 1,
      title: 'Evening Service',
      date: new Date(),
      startTime: '5:00 PM',
      endTime: '11:00 PM',
      location: 'Downtown',
    },
    {
      id: 2,
      title: 'Lunch Service',
      date: new Date(Date.now() + 86400000),
      startTime: '11:00 AM',
      endTime: '4:00 PM',
      location: 'Beach',
    },
    {
      id: 3,
      title: 'Brunch Service',
      date: new Date(Date.now() + 172800000),
      startTime: '9:00 AM',
      endTime: '3:00 PM',
      location: 'Midtown',
    },
  ];

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Shifts</h2>
      <div className="space-y-4">
        {shifts.map((shift) => (
          <div key={shift.id} className="border-b last:border-0 pb-4 last:pb-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">{shift.title}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {format(shift.date, 'EEE, MMM d')} • {shift.startTime} - {shift.endTime}
                </p>
                <p className="text-xs text-primary-500 mt-1">{shift.location}</p>
              </div>
              <button className="text-sm text-primary-500 hover:text-primary-600">
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};