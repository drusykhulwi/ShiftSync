// frontend/src/components/staff/AvailabilityManager/AvailabilityBlock.tsx
import React from 'react';
import { TimePicker } from '../../common/TimePicker';

interface AvailabilityBlockProps {
  day: string;
  dayIndex: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  onToggle: (dayIndex: number) => void;
  onTimeChange: (dayIndex: number, type: 'start' | 'end', value: string) => void;
}

export const AvailabilityBlock: React.FC<AvailabilityBlockProps> = ({
  day,
  dayIndex,
  startTime,
  endTime,
  isAvailable,
  onToggle,
  onTimeChange,
}) => {
  return (
    <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
      <div className="w-24">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={() => onToggle(dayIndex)}
            className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700">{day}</span>
        </label>
      </div>

      {isAvailable && (
        <>
          <div className="flex-1">
            <TimePicker
              value={startTime}
              onChange={(val) => onTimeChange(dayIndex, 'start', val)}
            />
          </div>
          <span className="text-gray-500">to</span>
          <div className="flex-1">
            <TimePicker
              value={endTime}
              onChange={(val) => onTimeChange(dayIndex, 'end', val)}
            />
          </div>
        </>
      )}
    </div>
  );
};