// frontend/src/components/staff/AvailabilityManager/WeeklyAvailability.tsx
import React, { useState, useEffect } from 'react';
import { AvailabilityBlock } from './AvailabilityBlock';
import { Button } from '../../common/Button';

interface WeeklyAvailabilityProps {
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
  onChange: (availability: any[]) => void;
  onSave?: (availability: any[]) => Promise<void>;
  isSaving?: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const WeeklyAvailability: React.FC<WeeklyAvailabilityProps> = ({
  availability,
  onChange,
  onSave,
  isSaving,
}) => {
  const [localAvailability, setLocalAvailability] = useState(
    DAYS.map((_, index) => {
      const existing = availability.find(a => a.dayOfWeek === index);
      return existing || {
        dayOfWeek: index,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: index >= 1 && index <= 5,
      };
    })
  );

  // Sync when parent availability loads (after API fetch)
  useEffect(() => {
    if (availability.length > 0) {
      setLocalAvailability(
        DAYS.map((_, index) => {
          const existing = availability.find(a => a.dayOfWeek === index);
          return existing || {
            dayOfWeek: index,
            startTime: '09:00',
            endTime: '17:00',
            isAvailable: index >= 1 && index <= 5,
          };
        })
      );
    }
  }, [availability]);

  const handleToggle = (dayIndex: number) => {
    const updated = [...localAvailability];
    updated[dayIndex] = {
      ...updated[dayIndex],
      isAvailable: !updated[dayIndex].isAvailable,
    };
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
    const toSave = localAvailability.map(a => ({
      ...a,
      isRecurring: true, // weekly availability is always recurring
    }));
    onChange(toSave.filter(a => a.isAvailable));
    // Call the actual API save if provided
    if (onSave) {
      await onSave(toSave);
    }
  };

  const setDefaultHours = () => {
    const updated = localAvailability.map((a, index) => ({
      ...a,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: index >= 1 && index <= 5,
    }));
    setLocalAvailability(updated);
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