// frontend/src/components/location/LocationList/LocationList.tsx
import React, { useState } from 'react';
import { Location } from '../../../types/location.types';
import { LocationCard } from '../LocationCard/LocationCard';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Select, Option } from '../../common/Select';

interface LocationListProps {
  locations: Location[];
  locationStats?: Record<string, any>;
  isLoading?: boolean;
  onLocationClick?: (location: Location) => void;
  onAddClick?: () => void;
}

export const LocationList: React.FC<LocationListProps> = ({
  locations,
  locationStats = {},
  isLoading,
  onLocationClick,
  onAddClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ? true :
                         statusFilter === 'active' ? location.isActive :
                         statusFilter === 'inactive' ? !location.isActive : true;
    
    return matchesSearch && matchesStatus;
  });

  const statusOptions: Option[] = [
    { value: 'all', label: 'All Locations' },
    { value: 'active', label: 'Active Only' },
    { value: 'inactive', label: 'Inactive Only' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search locations by name, city, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            value={statusOptions.find(opt => opt.value === statusFilter) || statusOptions[0]}
            onChange={(opt) => setStatusFilter(opt?.value as string || 'all')}
            options={statusOptions}
          />
        </div>
        <Button onClick={onAddClick}>+ Add Location</Button>
      </div>

      <div className="text-sm text-gray-500">
        Showing {filteredLocations.length} of {locations.length} locations
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              stats={locationStats[location.id]}
              onClick={onLocationClick}
            />
          ))}
        </div>
      )}

      {filteredLocations.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No locations found</p>
        </div>
      )}
    </div>
  );
};