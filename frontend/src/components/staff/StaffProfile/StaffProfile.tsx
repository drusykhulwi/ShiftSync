// frontend/src/components/staff/StaffProfile/StaffProfile.tsx
import React, { useState, useEffect } from 'react';
import { StaffMember } from '../../../types/staff.types';
import { Tabs } from '../../common/Tabs';
import { StaffInfo } from './StaffInfo';
import { StaffSkills } from './StaffSkills';
import { AvailabilityManager } from '../AvailabilityManager/AvailabilityManager';
import { Modal } from '../../common/Modal';
import { AddCertification } from '../CertificationManager/AddCertification';
import { staffService } from '../../../services/api/staff.service';
import { usersService } from '../../../services/api/users.service';

interface StaffProfileProps {
  staff: StaffMember;
  onUpdate?: (staff: StaffMember) => void;
}

export const StaffProfile: React.FC<StaffProfileProps> = ({ staff: initialStaff, onUpdate }) => {
  const [staff, setStaff] = useState<StaffMember>(initialStaff);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // Keep in sync if parent passes new staff data
  useEffect(() => {
    setStaff(initialStaff);
  }, [initialStaff]);

  const refreshStaff = async () => {
    try {
      const response = await staffService.getStaffById(staff.id);
      const updated = (response as any).data?.data || (response as any).data;
      if (updated) {
        setStaff(updated);
        onUpdate?.(updated);
      }
    } catch (error) {
      console.error('Failed to refresh staff:', error);
    }
  };

  const handleRemoveSkill = async (certificationId: string) => {
    if (!window.confirm('Remove this certification?')) return;
    setIsRemoving(certificationId);
    try {
      await usersService.removeCertification(staff.id, certificationId);
      await refreshStaff();
    } catch (error) {
      console.error('Failed to remove certification:', error);
    } finally {
      setIsRemoving(null);
    }
  };

  const handleCertificationAdded = async () => {
    setIsAddSkillModalOpen(false);
    await refreshStaff();
  };

  const tabs = [
    {
      id: 'info',
      label: 'Information',
      content: <StaffInfo staff={staff} />,
    },
    {
      id: 'skills',
      label: 'Skills & Certifications',
      content: (
        <StaffSkills
          staff={staff}
          onAddSkill={() => setIsAddSkillModalOpen(true)}
          onRemoveSkill={handleRemoveSkill}
          removingId={isRemoving}
        />
      ),
    },
    {
      id: 'availability',
      label: 'Availability',
      content: <AvailabilityManager staff={staff} />,
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs tabs={tabs} />

      <Modal
        isOpen={isAddSkillModalOpen}
        onClose={() => setIsAddSkillModalOpen(false)}
        title="Add Certification"
      >
        <AddCertification
          staffId={staff.id}
          onSuccess={handleCertificationAdded}
          onCancel={() => setIsAddSkillModalOpen(false)}
        />
      </Modal>
    </div>
  );
};