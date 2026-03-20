// frontend/src/components/schedule/ShiftForm/ShiftForm.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { DatePicker } from '../../common/DatePicker';
import { TimePicker } from '../../common/TimePicker';
import { ShiftRequirements } from './ShiftRequirements';
import { CreateShiftDto } from '../../../types/shift.types';
import { useAuth } from '../../../hooks/useAuth';
import { locationsService } from '../../../services/api/locations.service';

interface ShiftFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateShiftDto) => Promise<void>;
  locations: { id: string; name: string }[];
  skills: { id: string; name: string; category: string }[];
  initialData?: Partial<CreateShiftDto>;
  onToast?: (message: string, type: 'success' | 'error' | 'warning') => void;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  locations,
  skills,
  initialData,
  onToast,
}) => {
  const { user } = useAuth();
  const [managedLocationIds, setManagedLocationIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateShiftDto>({
    locationId: initialData?.locationId || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    startTime: initialData?.startTime || new Date(),
    endTime: initialData?.endTime || new Date(),
    requirements: initialData?.requirements || [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (isOpen && user?.role === 'MANAGER') {
      fetchManagedLocations();
    }
  }, [isOpen, user]);

  const fetchManagedLocations = async () => {
    try {
      const response = await locationsService.getMyLocations();
      const list = (response as any).data?.data || (response as any).data || [];
      const ids = list.map((l: any) => l.id);
      setManagedLocationIds(ids);
      // Auto-select if only one location
      if (ids.length === 1) {
        setFormData(prev => ({ ...prev, locationId: ids[0] }));
      }
    } catch (error) {
      console.error('Failed to fetch managed locations:', error);
    }
  };

  // For managers: only show their managed locations
  // For admins: show all locations
  const availableLocations = user?.role === 'MANAGER'
    ? locations.filter(l => managedLocationIds.includes(l.id))
    : locations;

  const locationOptions = availableLocations.map(loc => ({
    value: loc.id,
    label: loc.name,
  }));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.locationId) newErrors.locationId = 'Location is required';
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (formData.endTime <= formData.startTime) newErrors.endTime = 'End time must be after start time';
    if (formData.requirements.length === 0) newErrors.requirements = 'At least one requirement is needed';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError('');
    try {
      await onSubmit(formData);
      onClose();
    } catch (error: any) {
      const status = error.response?.status;
      const msg = error.response?.data?.error?.error?.message ||
                  error.response?.data?.error?.message ||
                  error.message || 'Failed to create shift';

      let userMessage = msg;
      if (status === 403) {
        userMessage = 'You do not have access to create shifts at this location. Make sure this location is assigned to your manager account.';
      } else if (status === 401) {
        userMessage = 'Your session has expired. Please log out and log back in.';
      } else if (error.message?.includes('timeout')) {
        userMessage = 'The server is starting up. Please wait a moment and try again.';
      }

      setSubmitError(userMessage);
      onToast?.(userMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const noLocationsAvailable = user?.role === 'MANAGER' && managedLocationIds.length === 0 && isOpen;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Shift" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {submitError}
          </div>
        )}

        {noLocationsAvailable && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
            ⚠️ You have no locations assigned to your account. Contact an admin to assign you to a location before creating shifts.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={`Location ${user?.role === 'MANAGER' ? '(Your locations only)' : ''}`}
            value={locationOptions.find(opt => opt.value === formData.locationId) || null}
            onChange={(opt) => setFormData({ ...formData, locationId: String(opt?.value || '') })}
            options={locationOptions}
            error={errors.locationId}
            placeholder={locationOptions.length === 0 ? 'No locations available' : 'Select location'}
          />
          <Input
            label="Shift Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
            placeholder="e.g., Evening Service"
          />
        </div>

        <Input
          label="Description (Optional)"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional details about the shift"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePicker
            label="Start Date"
            value={formData.startTime instanceof Date
              ? formData.startTime.toISOString().split('T')[0]
              : new Date(formData.startTime).toISOString().split('T')[0]}
            onChange={(date) => {
              const newDate = new Date(date);
              const st = formData.startTime instanceof Date ? formData.startTime : new Date(formData.startTime);
              newDate.setHours(st.getHours(), st.getMinutes());
              setFormData({ ...formData, startTime: newDate });
            }}
            error={errors.startTime}
          />
          <TimePicker
            label="Start Time"
            value={formData.startTime instanceof Date
              ? formData.startTime.toTimeString().slice(0, 5)
              : new Date(formData.startTime).toTimeString().slice(0, 5)}
            onChange={(time) => {
              const [hours, minutes] = time.split(':').map(Number);
              const newDate = new Date(formData.startTime);
              newDate.setHours(hours, minutes);
              setFormData({ ...formData, startTime: newDate });
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePicker
            label="End Date"
            value={formData.endTime instanceof Date
              ? formData.endTime.toISOString().split('T')[0]
              : new Date(formData.endTime).toISOString().split('T')[0]}
            onChange={(date) => {
              const newDate = new Date(date);
              const et = formData.endTime instanceof Date ? formData.endTime : new Date(formData.endTime);
              newDate.setHours(et.getHours(), et.getMinutes());
              setFormData({ ...formData, endTime: newDate });
            }}
            error={errors.endTime}
          />
          <TimePicker
            label="End Time"
            value={formData.endTime instanceof Date
              ? formData.endTime.toTimeString().slice(0, 5)
              : new Date(formData.endTime).toTimeString().slice(0, 5)}
            onChange={(time) => {
              const [hours, minutes] = time.split(':').map(Number);
              const newDate = new Date(formData.endTime);
              newDate.setHours(hours, minutes);
              setFormData({ ...formData, endTime: newDate });
            }}
          />
        </div>

        <ShiftRequirements
          requirements={formData.requirements}
          skills={skills}
          onChange={(requirements) => setFormData({ ...formData, requirements })}
        />
        {errors.requirements && (
          <p className="text-sm text-red-500">{errors.requirements}</p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={noLocationsAvailable}
            className="w-full sm:w-auto"
          >
            Create Shift
          </Button>
        </div>
      </form>
    </Modal>
  );
};