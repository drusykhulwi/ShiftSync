// frontend/src/components/schedule/Calendar/WeekView.tsx
import React from 'react';
import { format, addDays, startOfWeek, isSameDay, isWithinInterval } from 'date-fns';
import { CalendarEvent as ICalendarEvent } from '../../../types/schedule.types';
import { CalendarEvent } from './CalendarEvent';

interface WeekViewProps {
  currentDate: Date;
  events: ICalendarEvent[];
  onEventClick?: (event: ICalendarEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        isSameDay(eventStart, day) &&
        eventStart.getHours() <= hour &&
        eventEnd.getHours() >= hour
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="py-2 px-3 text-sm font-medium text-gray-500 border-r border-gray-200">
          Time
        </div>
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="py-2 px-3 text-center border-r border-gray-200 last:border-r-0"
          >
            <div className="text-sm font-medium text-gray-900">
              {format(day, 'EEE')}
            </div>
            <div className="text-xs text-gray-500">
              {format(day, 'MMM d')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-200 last:border-b-0">
            {/* Time label */}
            <div className="py-2 px-3 text-xs text-gray-500 border-r border-gray-200">
              {format(new Date().setHours(hour, 0, 0, 0), 'ha')}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIndex) => {
              const dayEvents = getEventsForDayAndHour(day, hour);
              
              return (
                <div
                  key={dayIndex}
                  onClick={() => onTimeSlotClick?.(day, hour)}
                  className={`
                    relative min-h-[60px] p-1 border-r border-gray-200 last:border-r-0
                    hover:bg-gray-50 cursor-pointer transition-colors
                  `}
                >
                  {dayEvents.map((event, eventIndex) => (
                    <div key={eventIndex} className="mb-1">
                      <CalendarEvent
                        event={event}
                        onClick={onEventClick}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};