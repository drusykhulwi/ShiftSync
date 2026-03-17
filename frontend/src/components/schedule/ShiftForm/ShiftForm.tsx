// frontend/src/components/schedule/ShiftForm/ShiftForm.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Modal } from '../../common/Modal';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { DatePicker } from '../../common/DatePicker';
import { TimePicker } from '../../common/TimePicker';
import { ShiftRequirements } from './ShiftRequirements';
import { CreateShiftDto } from '../../../types/shift.types';

interface ShiftFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateShiftDto) => Promise<void>;
  locations: { id: string; name: string }[];
  skills: { id: string; name: string; category: string }[];
  initialData?: Partial<CreateShiftDto>;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  locations,
  skills,
  initialData,
}) => {
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

  const locationOptions = locations.map(loc => ({
    value: loc.id,
    label: loc.name,
  }));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.locationId) {
      newErrors.locationId = 'Location is required';
    }
    if (!formData.title) {
      newErrors.title = 'Title is required';
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }
    if (formData.endTime <= formData.startTime) {
      newErrors.endTime = 'End time must be after start time';
    }
    if (formData.requirements.length === 0) {
      newErrors.requirements = 'At least one requirement is needed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to create shift:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Shift" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Location"
            value={locationOptions.find(opt => opt.value === formData.locationId) || null}
            onChange={(opt) => setFormData({ ...formData, locationId: opt?.value || '' })}
            options={locationOptions}
            error={errors.locationId}
            placeholder="Select location"
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

        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="Start Date"
            value={formData.startTime.toISOString().split('T')[0]}
            onChange={(date) => {
              const newDate = new Date(date);
              newDate.setHours(formData.startTime.getHours(), formData.startTime.getMinutes());
              setFormData({ ...formData, startTime: newDate });
            }}
            error={errors.startTime}
          />
          <TimePicker
            label="Start Time"
            value={formData.startTime.toTimeString().slice(0, 5)}
            onChange={(time) => {
              const [hours, minutes] = time.split(':').map(Number);
              const newDate = new Date(formData.startTime);
              newDate.setHours(hours, minutes);
              setFormData({ ...formData, startTime: newDate });
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="End Date"
            value={formData.endTime.toISOString().split('T')[0]}
            onChange={(date) => {
              const newDate = new Date(date);
              newDate.setHours(formData.endTime.getHours(), formData.endTime.getMinutes());
              setFormData({ ...formData, endTime: newDate });
            }}
            error={errors.endTime}
          />
          <TimePicker
            label="End Time"
            value={formData.endTime.toTimeString().slice(0, 5)}
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

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Shift
          </Button>
        </div>
      </form>
    </Modal>
  );
};