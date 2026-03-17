// frontend/src/components/location/LocationCard/LocationCard.tsx
import React from 'react';
import { Location } from '../../../types/location.types';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';

interface LocationCardProps {
  location: Location;
  stats?: {
    totalStaff: number;
    totalManagers: number;
    todayShifts: number;
  };
  onClick?: (location: Location) => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  stats,
  onClick,
}) => {
  const formatTimezone = (timezone: string) => {
    return timezone.split('/').pop()?.replace('_', ' ') || timezone;
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(location)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{location.address}</p>
          <p className="text-sm text-gray-500">
            {location.city}, {location.state} {location.zipCode}
          </p>
        </div>
        <Badge variant={location.isActive ? 'success' : 'error'}>
          {location.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Staff</p>
          <p className="text-xl font-bold text-gray-900">{stats?.totalStaff || 0}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Managers</p>
          <p className="text-xl font-bold text-gray-900">{stats?.totalManagers || 0}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Today's Shifts</p>
          <p className="text-xl font-bold text-gray-900">{stats?.todayShifts || 0}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Timezone</p>
          <p className="text-sm font-medium text-gray-900 truncate" title={location.timezone}>
            {formatTimezone(location.timezone)}
          </p>
        </div>
      </div>

      {(location.phone || location.email) && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          {location.phone && (
            <p className="text-sm text-gray-600">
              📞 <a href={`tel:${location.phone}`} className="hover:text-primary-500">
                {location.phone}
              </a>
            </p>
          )}
          {location.email && (
            <p className="text-sm text-gray-600 mt-1">
              ✉️ <a href={`mailto:${location.email}`} className="hover:text-primary-500">
                {location.email}
              </a>
            </p>
          )}
        </div>
      )}
    </Card>
  );
};