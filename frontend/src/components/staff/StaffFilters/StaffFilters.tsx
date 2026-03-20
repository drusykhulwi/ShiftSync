// frontend/src/components/staff/StaffFilters/StaffFilters.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { skillsService } from '../../../services/api/skills.service';
import { locationsService } from '../../../services/api/locations.service';

interface StaffFiltersProps {
  onFilterChange?: (filters: any) => void;
  onClose?: () => void;
}

export const StaffFilters: React.FC<StaffFiltersProps> = ({ onFilterChange, onClose }) => {
  const [skills, setSkills] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    role: '',
    location: '',
    status: '',
    minHours: '',
    maxHours: '',
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [skillsRes, locationsRes] = await Promise.all([
        skillsService.getSkills(),
        locationsService.getLocations(),
      ]);
      setSkills((skillsRes as any).data?.data || (skillsRes as any).data || []);
      setLocations((locationsRes as any).data?.data || (locationsRes as any).data || []);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'STAFF', label: 'Staff' },
  ];

  const locationOptions = [
    { value: '', label: 'All Locations' },
    ...locations.map(l => ({ value: l.id, label: l.name })),
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const handleChange = (key: string, value: string) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onFilterChange?.(updated);
  };

  const handleReset = () => {
    const reset = { role: '', location: '', status: '', minHours: '', maxHours: '' };
    setFilters(reset);
    onFilterChange?.(reset);
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900">Filters</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Select
          label="Role"
          value={roleOptions.find(opt => opt.value === filters.role) || roleOptions[0]}
          onChange={(opt) => handleChange('role', opt?.value?.toString() || '')}
          options={roleOptions}
        />
        <Select
          label="Location"
          value={locationOptions.find(opt => opt.value === filters.location) || locationOptions[0]}
          onChange={(opt) => handleChange('location', opt?.value?.toString() || '')}
          options={locationOptions}
        />
        <Select
          label="Status"
          value={statusOptions.find(opt => opt.value === filters.status) || statusOptions[0]}
          onChange={(opt) => handleChange('status', opt?.value?.toString() || '')}
          options={statusOptions}
        />
        <Input
          label="Min Hours"
          type="number"
          value={filters.minHours}
          onChange={(e) => handleChange('minHours', e.target.value)}
          placeholder="0"
        />
        <Input
          label="Max Hours"
          type="number"
          value={filters.maxHours}
          onChange={(e) => handleChange('maxHours', e.target.value)}
          placeholder="168"
        />
      </div>

      <div className="flex justify-end space-x-3 mt-4 pt-3 border-t">
        <Button variant="outline" size="sm" onClick={handleReset}>Reset</Button>
        <Button size="sm" onClick={onClose}>Apply</Button>
      </div>
    </Card>
  );
};