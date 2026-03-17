// frontend/src/components/schedule/Calendar/CalendarEvent.tsx
import React from 'react';
import { CalendarEvent as ICalendarEvent } from '../../../types/schedule.types';
import { Badge } from '../../common/Badge';

interface CalendarEventProps {
  event: ICalendarEvent;
  onClick?: (event: ICalendarEvent) => void;
}

export const CalendarEvent: React.FC<CalendarEventProps> = ({ event, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'COMPLETED':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  const totalSpots = event.requirements.reduce((sum, r) => sum + r.headcount, 0);
  const filledSpots = event.requirements.reduce((sum, r) => sum + r.assigned, 0);
  const fillPercentage = (filledSpots / totalSpots) * 100;

  return (
    <div
      onClick={() => onClick?.(event)}
      className={`
        p-2 rounded border cursor-pointer transition-all hover:shadow-md
        ${getStatusColor(event.status)}
      `}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="font-medium text-sm truncate">{event.title}</span>
        <Badge size="sm" variant={
          event.status === 'PUBLISHED' ? 'success' :
          event.status === 'DRAFT' ? 'warning' :
          event.status === 'COMPLETED' ? 'info' : 'error'
        }>
          {event.status}
        </Badge>
      </div>
      
      <div className="text-xs opacity-75 mb-2">
        {event.locationName}
      </div>

      <div className="space-y-1">
        {event.requirements.map((req, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <span>{req.skillName}:</span>
            <span className="font-medium">
              {req.assigned}/{req.headcount}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full"
          style={{ width: `${fillPercentage}%` }}
        />
      </div>

      {event.assignedStaff && event.assignedStaff.length > 0 && (
        <div className="mt-2 flex -space-x-2">
          {event.assignedStaff.slice(0, 3).map((staff) => (
            <div
              key={staff.id}
              className="w-6 h-6 rounded-full bg-secondary-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
              title={staff.name}
            >
              {staff.name.split(' ').map(n => n[0]).join('')}
            </div>
          ))}
          {event.assignedStaff.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium">
              +{event.assignedStaff.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
};