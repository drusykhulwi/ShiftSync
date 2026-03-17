// frontend/src/components/schedule/Calendar/Calendar.tsx
import React, { useState } from 'react';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import { CalendarEvent } from '../../../types/schedule.types';

interface CalendarProps {
  events: CalendarEvent[];
  view?: 'day' | 'week' | 'month';
  onViewChange?: (view: 'day' | 'week' | 'month') => void;
  onDateChange?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, hour?: number) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  events,
  view: externalView,
  onViewChange,
  onDateChange,
  onEventClick,
  onTimeSlotClick,
}) => {
  const [internalView, setInternalView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const view = externalView || internalView;

  const handleViewChange = (newView: 'day' | 'week' | 'month') => {
    setInternalView(newView);
    onViewChange?.(newView);
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const navigatePrevious = () => {
    let newDate = currentDate;
    switch (view) {
      case 'day':
        newDate = subDays(currentDate, 1);
        break;
      case 'week':
        newDate = subWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = subMonths(currentDate, 1);
        break;
    }
    handleDateChange(newDate);
  };

  const navigateNext = () => {
    let newDate = currentDate;
    switch (view) {
      case 'day':
        newDate = addDays(currentDate, 1);
        break;
      case 'week':
        newDate = addWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = addMonths(currentDate, 1);
        break;
    }
    handleDateChange(newDate);
  };

  const navigateToday = () => {
    handleDateChange(new Date());
  };

  const getViewTitle = () => {
    switch (view) {
      case 'day':
        return format(currentDate, 'MMMM d, yyyy');
      case 'week':
        const weekStart = currentDate;
        const weekEnd = addDays(currentDate, 6);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Calendar header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={navigatePrevious}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <button
            onClick={navigateToday}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={navigateNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
          <h2 className="text-lg font-semibold text-gray-800">{getViewTitle()}</h2>
        </div>

        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          {(['day', 'week', 'month'] as const).map((v) => (
            <button
              key={v}
              onClick={() => handleViewChange(v)}
              className={`
                px-3 py-1 text-sm font-medium rounded-md capitalize transition-colors
                ${view === v
                  ? 'bg-white text-primary-500 shadow'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar view */}
      <div className="flex-1 overflow-auto">
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventClick}
            onTimeSlotClick={(date, hour) => onTimeSlotClick?.(date, hour)}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventClick}
            onTimeSlotClick={(date, hour) => onTimeSlotClick?.(date, hour)}
          />
        )}
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onDateClick={(date) => handleDateChange(date)}
            onEventClick={onEventClick}
          />
        )}
      </div>
    </div>
  );
};