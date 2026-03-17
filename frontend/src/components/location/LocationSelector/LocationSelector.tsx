// frontend/src/components/location/LocationSelector/LocationSelector.tsx
import React, { useState, useEffect } from 'react';
import { Location } from '../../../types/location.types';
import { LocationBadge } from './LocationBadge';
import { locationsService } from '../../../services/api/locations.service';

interface LocationSelectorProps {
  selectedLocationId?: string;
  onLocationChange: (location: Location) => void;
  showAllOption?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocationId,
  onLocationChange,
  showAllOption = false,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const response = await locationsService.getMyLocations();
      setLocations(response.data || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading locations...</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {showAllOption && (
        <LocationBadge
          location={{ id: 'all', name: 'All Locations' } as Location}
          selected={!selectedLocationId}
          onClick={() => onLocationChange({ id: 'all', name: 'All Locations' } as Location)}
        />
      )}
      {locations.map((location) => (
        <LocationBadge
          key={location.id}
          location={location}
          selected={selectedLocationId === location.id}
          onClick={() => onLocationChange(location)}
        />
      ))}
    </div>
  );
};