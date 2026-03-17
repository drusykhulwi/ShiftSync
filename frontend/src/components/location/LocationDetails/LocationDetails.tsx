// frontend/src/components/location/LocationDetails/LocationDetails.tsx
import React from 'react';
import { Location, LocationStats } from '../../../types/location.types';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { Tabs } from '../../common/Tabs';

interface LocationDetailsProps {
  location: Location;
  stats?: LocationStats;
  managers?: any[];
  staff?: any[];
  upcomingShifts?: any[];
  onEdit?: () => void;
  onAssignManager?: () => void;
  onViewStaff?: () => void;
  onViewShifts?: () => void;
}

export const LocationDetails: React.FC<LocationDetailsProps> = ({
  location,
  stats,
  managers,
  staff,
  upcomingShifts,
  onEdit,
  onAssignManager,
  onViewStaff,
  onViewShifts,
}) => {
  const formatTimezone = (timezone: string) => {
    return timezone.split('/').pop()?.replace('_', ' ') || timezone;
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats.totalStaff || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Managers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats.totalManagers || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Today's Shifts</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats.todayShifts || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats.upcomingShifts || 0}</p>
            </div>
          </div>

          {/* Location Info */}
          <Card>
            <h4 className="font-medium text-gray-900 mb-3">Location Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{location.address}</p>
                <p className="text-sm text-gray-600">
                  {location.city}, {location.state} {location.zipCode}
                </p>
                <p className="text-sm text-gray-600">{location.country}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                {location.phone && (
                  <p className="text-sm">
                    📞 <a href={`tel:${location.phone}`} className="text-primary-500 hover:underline">
                      {location.phone}
                    </a>
                  </p>
                )}
                {location.email && (
                  <p className="text-sm">
                    ✉️ <a href={`mailto:${location.email}`} className="text-primary-500 hover:underline">
                      {location.email}
                    </a>
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Timezone</p>
                <p className="text-sm font-medium" title={location.timezone}>
                  {formatTimezone(location.timezone)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={location.isActive ? 'success' : 'error'}>
                  {location.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="flex space-x-3">
            <Button onClick={onViewStaff}>View Staff</Button>
            <Button onClick={onViewShifts}>View Shifts</Button>
            <Button variant="outline" onClick={onAssignManager}>Assign Manager</Button>
          </div>
        </div>
      ),
    },
    {
      id: 'managers',
      label: 'Managers',
      content: (
        <div className="space-y-4">
          {managers && managers.length > 0 ? (
            managers.map((manager) => (
              <div key={manager.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{manager.name}</p>
                  <p className="text-sm text-gray-500">{manager.email}</p>
                </div>
                <Badge variant="info">Manager</Badge>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No managers assigned</p>
          )}
          <Button variant="outline" onClick={onAssignManager} className="w-full">
            + Assign Manager
          </Button>
        </div>
      ),
    },
    {
      id: 'staff',
      label: 'Staff',
      content: (
        <div className="space-y-4">
          {staff && staff.length > 0 ? (
            staff.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <Badge variant="default">{member.skill}</Badge>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No staff assigned</p>
          )}
          {staff && staff.length > 5 && (
            <Button variant="outline" onClick={onViewStaff} className="w-full">
              View All {staff.length} Staff
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{location.name}</h2>
          <p className="text-gray-500">{location.city}, {location.state}</p>
        </div>
        <Button variant="outline" onClick={onEdit}>Edit Location</Button>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} />
    </div>
  );
};