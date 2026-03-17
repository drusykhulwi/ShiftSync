// frontend/src/components/schedule/Calendar/DayView.tsx
import React from 'react';
import { format, isSameDay } from 'date-fns';
import { CalendarEvent as ICalendarEvent } from '../../../types/schedule.types';
import { CalendarEvent } from './CalendarEvent';

interface DayViewProps {
  currentDate: Date;
  events: ICalendarEvent[];
  onEventClick?: (event: ICalendarEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
}) => {
  const dayEvents = events.filter(event => isSameDay(new Date(event.start), currentDate));

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}
      <div className="border-b border-gray-200">
        <div className="py-3 px-4 text-center">
          <div className="text-lg font-medium text-gray-900">
            {format(currentDate, 'EEEE')}
          </div>
          <div className="text-sm text-gray-500">
            {format(currentDate, 'MMMM d, yyyy')}
          </div>
        </div>
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        {HOURS.map((hour) => {
          const hourEvents = dayEvents.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            return eventStart.getHours() <= hour && eventEnd.getHours() >= hour;
          });

          return (
            <div
              key={hour}
              onClick={() => onTimeSlotClick?.(currentDate, hour)}
              className="flex border-b border-gray-200 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {/* Time label */}
              <div className="w-20 py-2 px-3 text-xs text-gray-500 border-r border-gray-200">
                {format(new Date().setHours(hour, 0, 0, 0), 'ha')}
              </div>

              {/* Events column */}
              <div className="flex-1 p-1">
                {hourEvents.map((event, index) => (
                  <div key={index} className="mb-1">
                    <CalendarEvent
                      event={event}
                      onClick={onEventClick}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};