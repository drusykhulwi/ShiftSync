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
  removingId?: string | null;
}

export const StaffSkills: React.FC<StaffSkillsProps> = ({
  staff,
  onAddSkill,
  onRemoveSkill,
  removingId,
}) => {
  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const days = Math.ceil(
      (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days <= 30 && days > 0;
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

      <div className="space-y-3">
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
                {isExpiringSoon(cert.expiresAt) && (
                  <Badge variant="warning" size="sm">Expiring Soon</Badge>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-3">
                <span>📍 {cert.locationName}</span>
                {cert.expiresAt && (
                  <span>📅 Expires {new Date(cert.expiresAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => onRemoveSkill?.(cert.id)}
              disabled={removingId === cert.id}
              className="text-red-500 hover:text-red-600 disabled:opacity-40 ml-4"
            >
              {removingId === cert.id ? '...' : '✕'}
            </button>
          </div>
        ))}

        {(!staff.certifications || staff.certifications.length === 0) && (
          <div className="text-center text-gray-500 py-6">
            <p className="text-3xl mb-2">🎓</p>
            <p className="text-sm">No skills or certifications added yet</p>
          </div>
        )}
      </div>
    </Card>
  );
};