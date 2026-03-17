// frontend/src/components/staff/StaffProfile/StaffSkills.tsx
import React from 'react';
import { StaffMember } from '../../../types/staff.types';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';

interface StaffSkillsProps {
  staff: StaffMember;
  onAddSkill?: () => void;
  onRemoveSkill?: (certificationId: string) => void;
}

export const StaffSkills: React.FC<StaffSkillsProps> = ({
  staff,
  onAddSkill,
  onRemoveSkill,
}) => {
  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const days = Math.ceil(
      (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days <= 30;
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Skills & Certifications</h3>
        <Button size="sm" onClick={onAddSkill}>+ Add Skill</Button>
      </div>

      <div className="space-y-4">
        {staff.certifications?.map((cert) => (
          <div
            key={cert.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{cert.skillName}</span>
                {isExpired(cert.expiresAt) && (
                  <Badge variant="error" size="sm">Expired</Badge>
                )}
                {isExpiringSoon(cert.expiresAt) && !isExpired(cert.expiresAt) && (
                  <Badge variant="warning" size="sm">Expiring Soon</Badge>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                <span>📍 {cert.locationName}</span>
                {cert.expiresAt && (
                  <span className="ml-3">
                    📅 Expires {new Date(cert.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onRemoveSkill?.(cert.id)}
              className="text-red-500 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}

        {(!staff.certifications || staff.certifications.length === 0) && (
          <p className="text-center text-gray-500 py-4">
            No skills or certifications added yet
          </p>
        )}
      </div>
    </Card>
  );
};