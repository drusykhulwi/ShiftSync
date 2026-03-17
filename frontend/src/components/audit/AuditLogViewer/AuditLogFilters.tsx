// frontend/src/components/audit/AuditLogViewer/AuditLogFilters.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Select } from '../../common/Select';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { AuditAction, AuditLogFilters as IAuditLogFilters } from '../../../types/audit.types';
import { usersService } from '../../../services/api/users.service';

interface AuditLogFiltersProps {
  onFilterChange: (filters: IAuditLogFilters) => void;
  onClose?: () => void;
}

const ACTION_OPTIONS: { value: AuditAction | ''; label: string }[] = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'ASSIGN', label: 'Assign' },
  { value: 'UNSIGN', label: 'Unassign' },
  { value: 'APPROVE', label: 'Approve' },
  { value: 'REJECT', label: 'Reject' },
  { value: 'PUBLISH', label: 'Publish' },
  { value: 'UNPUBLISH', label: 'Unpublish' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'EXPORT', label: 'Export' },
];

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'User', label: 'User' },
  { value: 'Location', label: 'Location' },
  { value: 'Skill', label: 'Skill' },
  { value: 'Shift', label: 'Shift' },
  { value: 'ShiftAssignment', label: 'Shift Assignment' },
  { value: 'SwapRequest', label: 'Swap Request' },
  { value: 'Notification', label: 'Notification' },
  { value: 'OvertimeWarning', label: 'Overtime Warning' },
  { value: 'Certification', label: 'Certification' },
];

export const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  onFilterChange,
  onClose,
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [filters, setFilters] = useState<IAuditLogFilters>({
    actorId: '',
    action: undefined,
    entityType: '',
    entityId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersService.getUsers({ limit: 100 });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const userOptions = [
    { value: '', label: 'All Users' },
    ...users.map(u => ({ 
      value: u.id, 
      label: `${u.firstName} ${u.lastName} (${u.email})` 
    })),
  ];

  const handleFilterChange = (key: keyof IAuditLogFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      actorId: '',
      action: undefined,
      entityType: '',
      entityId: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 50,
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900">Filter Audit Logs</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Select
          label="Actor"
          value={userOptions.find(opt => opt.value === filters.actorId) || userOptions[0]}
          onChange={(opt) => handleFilterChange('actorId', opt?.value || '')}
          options={userOptions}
        />

        <Select
          label="Action"
          value={ACTION_OPTIONS.find(opt => opt.value === filters.action) || ACTION_OPTIONS[0]}
          onChange={(opt) => handleFilterChange('action', opt?.value || undefined)}
          options={ACTION_OPTIONS}
        />

        <Select
          label="Entity Type"
          value={ENTITY_TYPE_OPTIONS.find(opt => opt.value === filters.entityType) || ENTITY_TYPE_OPTIONS[0]}
          onChange={(opt) => handleFilterChange('entityType', opt?.value || '')}
          options={ENTITY_TYPE_OPTIONS}
        />

        <Input
          label="Entity ID"
          value={filters.entityId || ''}
          onChange={(e) => handleFilterChange('entityId', e.target.value)}
          placeholder="Specific entity ID"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="datetime-local"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="datetime-local"
            value={filters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-4 pt-3 border-t">
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset Filters
        </Button>
        <Button size="sm" onClick={onClose}>
          Apply Filters
        </Button>
      </div>
    </Card>
  );
};