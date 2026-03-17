// frontend/src/components/staff/StaffProfile/StaffInfo.tsx
import React from 'react';
import { StaffMember } from '../../../types/staff.types';
import { Card } from '../../common/Card';
import { Avatar } from '../../common/Avatar';
import { Badge } from '../../common/Badge';

interface StaffInfoProps {
  staff: StaffMember;
}

export const StaffInfo: React.FC<StaffInfoProps> = ({ staff }) => {
  return (
    <Card>
      <div className="flex items-start space-x-6">
        <Avatar name={`${staff.firstName} ${staff.lastName}`} size="lg" />
        
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {staff.firstName} {staff.lastName}
          </h2>
          <p className="text-gray-500">{staff.email}</p>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{staff.phone || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Desired Hours</p>
              <p className="font-medium">{staff.desiredHours || 40}h/week</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={staff.isActive ? 'success' : 'error'} size="sm">
                {staff.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">
                {new Date(staff.createdAt || '').toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};