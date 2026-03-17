// frontend/src/components/staff/StaffFilters/StaffFilters.tsx
import React, { useState } from 'react';
import { Card } from '../../common/Card';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';

interface StaffFiltersProps {
  onFilterChange?: (filters: any) => void;
  onClose?: () => void;
}

export const StaffFilters: React.FC<StaffFiltersProps> = ({
  onFilterChange,
  onClose,
}) => {
  const [filters, setFilters] = useState({
    skill: '',
    location: '',
    status: '',
    minHours: '',
    maxHours: '',
  });

  // Mock options - replace with real data from API
  const skillOptions = [
    { value: '', label: 'All Skills' },
    { value: 'bartender', label: 'Bartender' },
    { value: 'server', label: 'Server' },
    { value: 'cook', label: 'Line Cook' },
  ];

  const locationOptions = [
    { value: '', label: 'All Locations' },
    { value: 'downtown', label: 'Downtown' },
    { value: 'beach', label: 'Beach' },
    { value: 'midtown', label: 'Midtown' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      skill: '',
      location: '',
      status: '',
      minHours: '',
      maxHours: '',
    };
    setFilters(resetFilters);
    onFilterChange?.(resetFilters);
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900">Filters</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Select
          label="Skill"
          value={skillOptions.find(opt => opt.value === filters.skill) || skillOptions[0]}
          onChange={(opt) => handleFilterChange('skill', opt?.value?.toString() || '')}
          options={skillOptions}
        />

        <Select
          label="Location"
          value={locationOptions.find(opt => opt.value === filters.location) || locationOptions[0]}
          onChange={(opt) => handleFilterChange('location', opt?.value?.toString() || '')}
          options={locationOptions}
        />

        <Select
          label="Status"
          value={statusOptions.find(opt => opt.value === filters.status) || statusOptions[0]}
          onChange={(opt) => handleFilterChange('status', opt?.value?.toString() || '')}
          options={statusOptions}
        />

        <Input
          label="Min Hours"
          type="number"
          value={filters.minHours}
          onChange={(e) => handleFilterChange('minHours', e.target.value)}
          placeholder="0"
        />

        <Input
          label="Max Hours"
          type="number"
          value={filters.maxHours}
          onChange={(e) => handleFilterChange('maxHours', e.target.value)}
          placeholder="168"
        />
      </div>

      <div className="flex justify-end space-x-3 mt-4 pt-3 border-t">
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset Filters
        </Button>
        <Button size="sm" onClick={onClose}>
          Apply Filters
        </Button>
      </div>
    </Card>
  );
};