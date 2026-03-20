// frontend/src/components/staff/StaffList/StaffCard.tsx
import React from 'react';
import { StaffMember } from '../../../types/staff.types';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { Avatar } from '../../common/Avatar';

interface StaffCardProps {
  staff: StaffMember;
  onClick?: (staff: StaffMember) => void;
}

export const StaffCard: React.FC<StaffCardProps> = ({ staff, onClick }) => {
  const getStatusColor = (hours: number) => {
    if (hours > 40) return 'error';
    if (hours > 35) return 'warning';
    return 'success';
  };

  // Mock hours - replace with real data
  const weeklyHours = 32;

  const getSkillName = (cert: any) =>
    cert.skillName || cert.skill?.name || '—';

  const getLocationName = (cert: any) =>
    cert.locationName || cert.location?.name || '—';

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onClick?.(staff)}>
      <div className="flex items-start space-x-4">
        <Avatar name={`${staff.firstName} ${staff.lastName}`} size="lg" />
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900">
                {staff.firstName} {staff.lastName}
              </h3>
              <p className="text-sm text-gray-500">{staff.email}</p>
            </div>
            <Badge variant={getStatusColor(weeklyHours)} size="sm">
              {weeklyHours}h/week
            </Badge>
          </div>

          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Skills</p>
            <div className="flex flex-wrap gap-1">
              {staff.certifications?.slice(0, 3).map((cert) => (
                <Badge key={cert.id} variant="info" size="sm">
                  {getSkillName(cert)}
                </Badge>
              ))}
              {(staff.certifications?.length || 0) > 3 && (
                <Badge variant="default" size="sm">
                  +{(staff.certifications?.length || 0) - 3} more
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            {staff.certifications?.slice(0, 3).map((cert) => (
              <span key={cert.id} >📍 {getLocationName(cert)}</span>
            ))}
            <span>📅 Joined {new Date(staff.createdAt || '').toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};