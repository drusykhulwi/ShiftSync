// frontend/src/components/schedule/Calendar/MonthView.tsx
import React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { CalendarEvent as ICalendarEvent } from '../../../types/schedule.types';
import { Badge } from '../../common/Badge';

interface MonthViewProps {
  currentDate: Date;
  events: ICalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: ICalendarEvent) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const dayEvents = events.filter(event => isSameDay(new Date(event.start), cloneDay));
      
      days.push(
        <div
          key={day.toString()}
          onClick={() => onDateClick?.(cloneDay)}
          className={`
            min-h-[100px] p-2 border border-gray-200
            ${!isSameMonth(day, monthStart) ? 'bg-gray-50 text-gray-400' : 'bg-white'}
            hover:bg-gray-50 cursor-pointer transition-colors
          `}
        >
          <div className="text-sm font-medium mb-1">
            {format(day, 'd')}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick?.(event);
                }}
                className={`
                  text-xs p-1 rounded truncate
                  ${event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : ''}
                  ${event.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${event.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : ''}
                  ${event.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                `}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <Badge size="sm" variant="default">
                +{dayEvents.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toString()} className="grid grid-cols-7">
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="flex flex-col h-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-2 px-3 text-sm font-medium text-gray-500 text-center">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto">
        {rows}
      </div>
    </div>
  );
};