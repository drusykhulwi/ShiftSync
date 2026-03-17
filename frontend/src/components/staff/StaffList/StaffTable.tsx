// frontend/src/components/staff/StaffList/StaffTable.tsx
import React from 'react';
import { StaffMember } from '../../../types/staff.types';
import { Table } from '../../common/Table';
import { Badge } from '../../common/Badge';
import { Avatar } from '../../common/Avatar';

interface StaffTableProps {
  data: StaffMember[];
  onRowClick?: (staff: StaffMember) => void;
}

export const StaffTable: React.FC<StaffTableProps> = ({ data, onRowClick }) => {
  const columns = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (item: StaffMember) => (
        <div className="flex items-center space-x-3">
          <Avatar name={`${item.firstName} ${item.lastName}`} size="sm" />
          <div>
            <div className="font-medium text-gray-900">
              {item.firstName} {item.lastName}
            </div>
            <div className="text-sm text-gray-500">{item.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'skills',
      header: 'Skills',
      render: (item: StaffMember) => (
        <div className="flex flex-wrap gap-1">
          {item.certifications?.slice(0, 2).map((cert) => (
            <Badge key={cert.id} variant="info" size="sm">
              {cert.skillName}
            </Badge>
          ))}
          {(item.certifications?.length || 0) > 2 && (
            <Badge variant="default" size="sm">
              +{(item.certifications?.length || 0) - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Primary Location',
      render: (item: StaffMember) => (
        <span className="text-sm text-gray-600">
          {item.certifications?.[0]?.locationName || '—'}
        </span>
      ),
    },
    {
      key: 'hours',
      header: 'Weekly Hours',
      render: (item: StaffMember) => {
        // Mock hours - replace with real data
        const hours = 32;
        const status = hours > 40 ? 'error' : hours > 35 ? 'warning' : 'success';
        return (
          <Badge variant={status} size="sm">
            {hours}h
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: StaffMember) => (
        <Badge variant={item.isActive ? 'success' : 'error'} size="sm">
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={data}
      onRowClick={onRowClick}
      emptyMessage="No staff members found"
    />
  );
};