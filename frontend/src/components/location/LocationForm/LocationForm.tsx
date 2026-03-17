// frontend/src/components/location/LocationForm/LocationForm.tsx
import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { CreateLocationDto, UpdateLocationDto } from '../../../types/location.types';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'America/Detroit', label: 'Michigan Time (ET)' },
  { value: 'America/Indiana/Indianapolis', label: 'Indiana Time (ET)' },
  { value: 'America/Kentucky/Louisville', label: 'Kentucky Time (ET)' },
];

const COUNTRIES = [
  { value: 'USA', label: 'United States' },
  { value: 'CAN', label: 'Canada' },
  { value: 'MEX', label: 'Mexico' },
];

interface LocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLocationDto | UpdateLocationDto) => Promise<void>;
  initialData?: Partial<CreateLocationDto>;
  title?: string;
}

export const LocationForm: React.FC<LocationFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = 'Add New Location',
}) => {
  const [formData, setFormData] = useState<CreateLocationDto>({
    name: initialData?.name || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zipCode: initialData?.zipCode || '',
    country: initialData?.country || 'USA',
    timezone: initialData?.timezone || 'America/New_York',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Location name is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.zipCode) newErrors.zipCode = 'ZIP code is required';
    if (!formData.timezone) newErrors.timezone = 'Timezone is required';

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
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
      console.error('Failed to save location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof CreateLocationDto, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Location Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="e.g., Coastal Eats - Downtown"
          required
        />

        <Input
          label="Address"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          error={errors.address}
          placeholder="123 Main St"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="City"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            error={errors.city}
            placeholder="Los Angeles"
            required
          />
          <Input
            label="State"
            value={formData.state}
            onChange={(e) => handleChange('state', e.target.value)}
            error={errors.state}
            placeholder="CA"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="ZIP Code"
            value={formData.zipCode}
            onChange={(e) => handleChange('zipCode', e.target.value)}
            error={errors.zipCode}
            placeholder="90001"
            required
          />
          <Select
            label="Country"
            value={COUNTRIES.find(c => c.value === formData.country) || COUNTRIES[0]}
            onChange={(opt) => handleChange('country', opt?.value as string || 'USA')}
            options={COUNTRIES}
            required
            />
        </div>

        <Select
        label="Timezone"
        value={TIMEZONES.find(tz => tz.value === formData.timezone) || TIMEZONES[0]}
        onChange={(opt) => handleChange('timezone', opt?.value as string || 'America/New_York')}
        options={TIMEZONES}
        required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone (Optional)"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="(213) 555-0123"
          />
          <Input
            label="Email (Optional)"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            placeholder="downtown@coastaleats.com"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {initialData ? 'Update Location' : 'Create Location'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};