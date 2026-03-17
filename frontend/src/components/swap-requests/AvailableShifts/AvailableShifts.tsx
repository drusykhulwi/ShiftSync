// frontend/src/components/swap-requests/AvailableShifts/AvailableShifts.tsx
import React, { useState, useEffect } from 'react';
import { ShiftPickup } from './ShiftPickup';
import { Select } from '../../common/Select';
import { Input } from '../../common/Input';
import { swapRequestsService } from '../../../services/api/swap-requests.service';
import { locationsService } from '../../../services/api/locations.service';
import { skillsService } from '../../../services/api/skills.service';

interface AvailableShiftsProps {
  onPickup: (shiftId: string) => Promise<void>;
}

export const AvailableShifts: React.FC<AvailableShiftsProps> = ({ onPickup }) => {
  const [shifts, setShifts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    locationId: '',
    skillId: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFilters();
    fetchAvailableShifts();
  }, []);

  useEffect(() => {
    fetchAvailableShifts();
  }, [filters]);

  const fetchFilters = async () => {
    try {
      const [locationsRes, skillsRes] = await Promise.all([
        locationsService.getLocations(),
        skillsService.getSkills(),
      ]);
      setLocations(locationsRes.data || []);
      setSkills(skillsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  };

  const fetchAvailableShifts = async () => {
    setIsLoading(true);
    try {
      const response = await swapRequestsService.getAvailableDrops(filters);
      setShifts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch available shifts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const locationOptions = [
    { value: '', label: 'All Locations' },
    ...locations.map(l => ({ value: l.id, label: l.name })),
  ];

  const skillOptions = [
    { value: '', label: 'All Skills' },
    ...skills.map(s => ({ value: s.id, label: s.name })),
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Location"
          value={locationOptions.find(opt => opt.value === filters.locationId) || locationOptions[0]}
          onChange={(opt) => setFilters(prev => ({ ...prev, locationId: opt?.value || '' }))}
          options={locationOptions}
        />
        <Select
          label="Skill"
          value={skillOptions.find(opt => opt.value === filters.skillId) || skillOptions[0]}
          onChange={(opt) => setFilters(prev => ({ ...prev, skillId: opt?.value || '' }))}
          options={skillOptions}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">📭</p>
          <p>No shifts available for pickup</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shifts.map((item) => (
            <ShiftPickup
                key={item.shift.id}
                shift={item.shift}
                expiresAt={item.expiresAt} // Pass the expiry date from the swap request
                onPickup={onPickup}
            />
          ))}
        </div>
      )}
    </div>
  );
};