// frontend/src/components/staff/AvailabilityManager/WeeklyAvailability.tsx
import React, { useState, useEffect } from 'react';
import { AvailabilityBlock } from './AvailabilityBlock';
import { Button } from '../../common/Button';

interface DayAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isRecurring?: boolean;
}

interface WeeklyAvailabilityProps {
  availability: DayAvailability[];
  onChange: (availability: DayAvailability[]) => void;
  onSave?: (availability: DayAvailability[]) => Promise<void>;
  isSaving?: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const defaultDay = (index: number): DayAvailability => ({
  dayOfWeek: index,
  startTime: '09:00',
  endTime: '17:00',
  isAvailable: index >= 1 && index <= 5,
  isRecurring: true,
});

export const WeeklyAvailability: React.FC<WeeklyAvailabilityProps> = ({
  availability,
  onChange,
  onSave,
  isSaving,
}) => {
  const buildLocal = (avail: DayAvailability[]) =>
    DAYS.map((_, index) => {
      const existing = avail.find(a => a.dayOfWeek === index);
      return existing
        ? { ...existing, isRecurring: true }
        : defaultDay(index);
    });

  const [localAvailability, setLocalAvailability] = useState(() => buildLocal(availability));

  // Sync when parent loads data from API
  useEffect(() => {
    if (availability.length > 0) {
      setLocalAvailability(buildLocal(availability));
    }
  }, [availability]);

  const handleToggle = (dayIndex: number) => {
    const updated = [...localAvailability];
    updated[dayIndex] = { ...updated[dayIndex], isAvailable: !updated[dayIndex].isAvailable };
    setLocalAvailability(updated);
  };

  const handleTimeChange = (dayIndex: number, type: 'start' | 'end', value: string) => {
    const updated = [...localAvailability];
    updated[dayIndex] = {
      ...updated[dayIndex],
      [type === 'start' ? 'startTime' : 'endTime']: value,
    };
    setLocalAvailability(updated);
  };

  const handleSave = async () => {
    const toSave = localAvailability.map(a => ({ ...a, isRecurring: true }));
    onChange(toSave);
    if (onSave) await onSave(toSave);
  };

  const setDefaultHours = () => {
    setLocalAvailability(DAYS.map((_, index) => defaultDay(index)));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">Weekly Availability</h4>
        <Button size="sm" variant="outline" onClick={setDefaultHours}>
          Reset to Default
        </Button>
      </div>

      <div className="space-y-2">
        {DAYS.map((day, index) => (
          <AvailabilityBlock
            key={day}
            day={day}
            dayIndex={index}
            startTime={localAvailability[index].startTime}
            endTime={localAvailability[index].endTime}
            isAvailable={localAvailability[index].isAvailable}
            onToggle={handleToggle}
            onTimeChange={handleTimeChange}
          />
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} isLoading={isSaving}>
          Save Availability
        </Button>
      </div>
    </div>
  );
};