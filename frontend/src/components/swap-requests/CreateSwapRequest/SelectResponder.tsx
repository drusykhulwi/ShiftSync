// frontend/src/components/swap-requests/CreateSwapRequest/SelectResponder.tsx
import React, { useState, useEffect } from 'react';
import { Select } from '../../common/Select';
import { Input } from '../../common/Input';
import { usersService } from '../../../services/api/users.service';

interface SelectResponderProps {
  locationId: string;
  selectedUserId?: string;
  onSelect: (userId: string) => void;
}

export const SelectResponder: React.FC<SelectResponderProps> = ({
  locationId,
  selectedUserId,
  onSelect,
}) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, [locationId]);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const response = await usersService.getStaffByLocation(locationId);
      setStaff(response.data || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStaff = staff.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const staffOptions = filteredStaff.map(s => ({
    value: s.id,
    label: `${s.firstName} ${s.lastName} (${s.email})`,
  }));

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search staff by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {isLoading ? (
        <div className="text-center py-4">Loading staff...</div>
      ) : (
        <Select
        label="Select Staff Member"
        value={staffOptions.find(opt => opt.value === selectedUserId) || null}
        onChange={(opt) => onSelect(opt?.value as string || '')}
        options={staffOptions}
        placeholder="Choose who to swap with"
        />
      )}
    </div>
  );
};