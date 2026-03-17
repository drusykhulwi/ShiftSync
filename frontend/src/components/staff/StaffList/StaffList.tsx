// frontend/src/components/staff/StaffList/StaffList.tsx
import React, { useState } from 'react';
import { StaffMember } from '../../../types/staff.types';
import { StaffCard } from './StaffCard';
import { StaffTable } from './StaffTable';
import { StaffFilters } from '../StaffFilters/StaffFilters';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';

interface StaffListProps {
  staff: StaffMember[];
  isLoading?: boolean;
  viewMode?: 'grid' | 'table';
  onViewModeChange?: (mode: 'grid' | 'table') => void;
  onStaffClick?: (staff: StaffMember) => void;
  onFilterChange?: (filters: any) => void;
}

export const StaffList: React.FC<StaffListProps> = ({
  staff,
  isLoading,
  viewMode = 'grid',
  onViewModeChange,
  onStaffClick,
  onFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredStaff = staff.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const email = s.email.toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || email.includes(term);
  });

  return (
    <div className="space-y-4">
      {/* Search and view toggle */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          🔍 Filters
        </Button>
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange?.('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-white shadow' : 'hover:bg-gray-200'
            }`}
          >
            📱
          </button>
          <button
            onClick={() => onViewModeChange?.('table')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'table' ? 'bg-white shadow' : 'hover:bg-gray-200'
            }`}
          >
            📋
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <StaffFilters
          onFilterChange={onFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Staff count */}
      <div className="text-sm text-gray-500">
        Showing {filteredStaff.length} of {staff.length} staff members
      </div>

      {/* Staff list */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => (
            <StaffCard
              key={member.id}
              staff={member}
              onClick={onStaffClick}
            />
          ))}
        </div>
      ) : (
        <StaffTable
          data={filteredStaff}
          onRowClick={onStaffClick}
        />
      )}
    </div>
  );
};