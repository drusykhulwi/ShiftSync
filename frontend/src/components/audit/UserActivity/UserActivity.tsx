// frontend/src/components/audit/UserActivity/UserActivity.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Select, Option } from '../../common/Select';
import { auditService } from '../../../services/api/audit.service';
import { usersService } from '../../../services/api/users.service';
import { UserActivity as IUserActivity } from '../../../types/audit.types';
import { format } from 'date-fns';
import { Badge } from '../../common/Badge';

export const UserActivity: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [days, setDays] = useState(30);
  const [activity, setActivity] = useState<IUserActivity | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchActivity();
    }
  }, [selectedUser, days]);

  const fetchUsers = async () => {
    try {
      const response = await usersService.getUsers({ limit: 100 });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const data = await auditService.getUserActivity(selectedUser, days);
      setActivity(data);
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const userOptions: Option[] = [
    { value: '', label: 'Select a user' },
    ...users.map(u => ({ 
      value: u.id, 
      label: `${u.firstName} ${u.lastName} (${u.email})` 
    })),
  ];

  const dayOptions: Option[] = [
    { value: 7, label: 'Last 7 Days' },
    { value: 30, label: 'Last 30 Days' },
    { value: 90, label: 'Last 90 Days' },
  ];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Select User"
            value={userOptions.find(opt => opt.value === selectedUser) || userOptions[0]}
            onChange={(opt) => setSelectedUser(opt?.value as string || '')}
            options={userOptions}
          />
          <Select
            label="Time Period"
            value={dayOptions.find(opt => opt.value === days) || dayOptions[1]}
            onChange={(opt) => setDays(opt?.value as number || 30)}
            options={dayOptions}
          />
        </div>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )}

      {activity && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <p className="text-sm text-gray-500">Total Actions</p>
              <p className="text-2xl font-bold text-gray-900">{activity.totalActions}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Period</p>
              <p className="text-lg font-medium text-gray-900">{activity.period}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Last Active</p>
              <p className="text-lg font-medium text-gray-900">
                {activity.lastActive ? format(new Date(activity.lastActive), 'MMM d, yyyy HH:mm') : 'Never'}
              </p>
            </Card>
          </div>

          {/* Action Summary */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Action Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(activity.actionSummary).map(([action, count]) => (
                <div key={action} className="bg-gray-50 p-3 rounded-lg">
                  <Badge variant={getActionColor(action)} size="sm">
                    {action}
                  </Badge>
                  <p className="text-xl font-bold text-gray-900 mt-2">{count}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Daily Activity Timeline */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Activity</h3>
            <div className="space-y-4">
              {Object.entries(activity.dailyActivity).map(([date, actions]) => (
                <div key={date} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                  <h4 className="font-medium text-gray-700 mb-2">{format(new Date(date), 'EEEE, MMMM d, yyyy')}</h4>
                  <div className="space-y-2">
                    {actions.map((action, index) => (
                      <div key={index} className="flex items-center space-x-3 text-sm">
                        <Badge variant={getActionColor(action.action)} size="sm">
                          {action.action}
                        </Badge>
                        <span className="text-gray-600">{action.entityType}</span>
                        <span className="text-gray-400 text-xs">
                          {format(new Date(action.time), 'HH:mm:ss')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};