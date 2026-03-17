// frontend/src/components/staff/AvailabilityManager/AvailabilityManager.tsx
import React, { useState } from 'react';
import { StaffMember } from '../../../types/staff.types';
import { Card } from '../../common/Card';
import { Tabs } from '../../common/Tabs';
import { WeeklyAvailability } from './WeeklyAvailability';
import { ExceptionDates } from './ExceptionDates';

interface AvailabilityManagerProps {
  staff: StaffMember;
}

export const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({ staff }) => {
  const [availability, setAvailability] = useState<any[]>([]); // Type properly

  const tabs = [
    {
      id: 'weekly',
      label: 'Weekly Schedule',
      content: (
        <WeeklyAvailability
          availability={availability}
          onChange={(newAvailability) => setAvailability(newAvailability)}
        />
      ),
    },
    {
      id: 'exceptions',
      label: 'Exceptions',
      content: <ExceptionDates staffId={staff.id} />,
    },
  ];

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Availability</h3>
      <Tabs tabs={tabs} />
    </Card>
  );
};