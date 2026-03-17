// frontend/src/components/location/LocationSelector/LocationBadge.tsx
import React from 'react';
import { Location } from '../../../types/location.types';

interface LocationBadgeProps {
  location: Location;
  onClick?: () => void;
  selected?: boolean;
}

export const LocationBadge: React.FC<LocationBadgeProps> = ({
  location,
  onClick,
  selected = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
        transition-colors whitespace-nowrap
        ${selected
          ? 'bg-primary-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `}
    >
      <span className="mr-1">📍</span>
      {location.name}
    </button>
  );
};