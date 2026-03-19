// frontend/src/components/staff/CertificationManager/AddCertification.tsx
import React, { useState, useEffect } from 'react';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { DatePicker } from '../../common/DatePicker';
import { skillsService } from '../../../services/api/skills.service';
import { locationsService } from '../../../services/api/locations.service';
import { staffService } from '../../../services/api/staff.service';

interface AddCertificationProps {
  staffId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddCertification: React.FC<AddCertificationProps> = ({
  staffId,
  onSuccess,
  onCancel,
}) => {
  const [skills, setSkills] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [skillsRes, locationsRes] = await Promise.all([
          skillsService.getSkills(),
          locationsService.getLocations(),
        ]);
        // Unwrap double-wrapped responses
        setSkills((skillsRes as any).data?.data || (skillsRes as any).data || []);
        setLocations((locationsRes as any).data?.data || (locationsRes as any).data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const skillOptions = skills.map(s => ({ value: s.id, label: s.name }));
  const locationOptions = locations.map(l => ({ value: l.id, label: l.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkill || !selectedLocation) {
      setError('Please select both a skill and a location');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await staffService.addCertification(staffId, {
        skillId: selectedSkill,
        locationId: selectedLocation,
        expiresAt: expiryDate ? new Date(expiryDate) : undefined,
      });
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.error?.message || 'Failed to add certification');
      console.error('Failed to add certification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Select
        label="Skill"
        value={skillOptions.find(opt => opt.value === selectedSkill) || null}
        onChange={(opt) => setSelectedSkill(opt?.value?.toString() || '')}
        options={skillOptions}
        placeholder="Select a skill"
      />

      <Select
        label="Location"
        value={locationOptions.find(opt => opt.value === selectedLocation) || null}
        onChange={(opt) => setSelectedLocation(opt?.value?.toString() || '')} // ← was wrongly setting selectedSkill
        options={locationOptions}
        placeholder="Select a location"
      />

      <DatePicker
        label="Expiry Date (Optional)"
        value={expiryDate}
        onChange={setExpiryDate}
      />

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
          Add Certification
        </Button>
      </div>
    </form>
  );
};