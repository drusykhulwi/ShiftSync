// frontend/src/components/schedule/AssignmentDialog/AssignmentDialog.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { Select } from '../../common/Select';
import { Shift } from '../../../types/shift.types';
import { usersService } from '../../../services/api/users.service';

interface AssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift;
  staff: any[];
  onAssign: (shiftId: string, userId: string, requirementId: string) => Promise<void>;
}

export const AssignmentDialog: React.FC<AssignmentDialogProps> = ({
  isOpen,
  onClose,
  shift,
  staff,
  onAssign,
}) => {
  const [selectedRequirement, setSelectedRequirement] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);

  useEffect(() => {
    if (shift.locationId) {
      fetchAvailableStaff();
    }
  }, [shift.locationId]);

  const fetchAvailableStaff = async () => {
    try {
      const response = await usersService.getStaffByLocation(shift.locationId);
      setAvailableStaff(response.data || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const requirementOptions = shift.requirements?.map(req => ({
    value: req.id,
    label: `${req.skill.name} (${req.assignments?.length || 0}/${req.headcount} assigned)`,
  })) || [];

  const staffOptions = availableStaff.map(s => ({
    value: s.id,
    label: `${s.firstName} ${s.lastName}`,
  }));

  const handleAssign = async () => {
    if (!selectedRequirement || !selectedStaff) return;
    
    setIsLoading(true);
    try {
      await onAssign(shift.id, selectedStaff, selectedRequirement);
      onClose();
    } catch (error) {
      console.error('Failed to assign staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Staff to Shift">
      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">{shift.title}</h3>
          <p className="text-sm text-gray-600">
            {new Date(shift.startTime).toLocaleString()} - {new Date(shift.endTime).toLocaleString()}
          </p>
        </div>

        <Select
          label="Select Requirement"
          value={requirementOptions.find(opt => opt.value === selectedRequirement) || null}
          onChange={(opt) => setSelectedRequirement(opt?.value?.toString() || '')}
          options={requirementOptions}
          placeholder="Choose a position to fill"
        />

        <Select
          label="Select Staff Member"
          value={staffOptions.find(opt => opt.value === selectedStaff) || null}
          onChange={(opt) => setSelectedStaff(opt?.value?.toString() || '')}
          options={staffOptions}
          placeholder="Choose staff member to assign"
        />

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            isLoading={isLoading}
            disabled={!selectedRequirement || !selectedStaff}
          >
            Assign Staff
          </Button>
        </div>
      </div>
    </Modal>
  );
};
