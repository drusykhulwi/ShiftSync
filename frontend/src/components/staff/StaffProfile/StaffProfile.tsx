// frontend/src/components/staff/StaffProfile/StaffProfile.tsx
import React, { useState } from 'react';
import { StaffMember } from '../../../types/staff.types';
import { Tabs } from '../../common/Tabs';
import { StaffInfo } from './StaffInfo';
import { StaffSkills } from './StaffSkills';
import { AvailabilityManager } from '../AvailabilityManager/AvailabilityManager';
import { Modal } from '../../common/Modal';
import { AddCertification } from '../CertificationManager/AddCertification';

interface StaffProfileProps {
  staff: StaffMember;
  onUpdate?: (staff: StaffMember) => void;
}

export const StaffProfile: React.FC<StaffProfileProps> = ({ staff, onUpdate }) => {
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);

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
          onRemoveSkill={async (certId) => {
            // Handle remove skill
            console.log('Remove skill:', certId);
          }}
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
          onSuccess={() => {
            setIsAddSkillModalOpen(false);
            // Refresh staff data
          }}
          onCancel={() => setIsAddSkillModalOpen(false)}
        />
      </Modal>
    </div>
  );
};