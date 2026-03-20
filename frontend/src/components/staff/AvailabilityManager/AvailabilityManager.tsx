// frontend/src/components/staff/AvailabilityManager/AvailabilityManager.tsx
import React, { useState, useEffect } from 'react';
import { StaffMember } from '../../../types/staff.types';
import { Card } from '../../common/Card';
import { Tabs } from '../../common/Tabs';
import { WeeklyAvailability } from './WeeklyAvailability';
import { ExceptionDates } from './ExceptionDates';
import apiClient from '../../../services/api/client';

interface AvailabilityManagerProps {
  staff: StaffMember;
}

export const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({ staff }) => {
  const [availability, setAvailability] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, [staff.id]);

  const fetchAvailability = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/users/${staff.id}/availability`);
      // Response is triple-wrapped: { success, data: { success, data: [...] } }
      const raw = (response as any).data;
      const data = raw?.data?.data || raw?.data || raw || [];
      setAvailability(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      setAvailability([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (newAvailability: any[]) => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await apiClient.put(`/users/${staff.id}/availability`, {
        availability: newAvailability,
      });
      setAvailability(newAvailability);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Failed to save availability';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    {
      id: 'weekly',
      label: 'Weekly Schedule',
      content: isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
        </div>
      ) : (
        <>
          {saveError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              ✅ Availability saved successfully
            </div>
          )}
          <WeeklyAvailability
            availability={availability}
            onChange={setAvailability}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </>
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