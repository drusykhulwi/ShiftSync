// frontend/src/components/notifications/NotificationCenter/NotificationList.tsx
import React from 'react';
import { Notification } from '../../../types/notification.types';
import { NotificationItem } from '../NotificationItem/NotificationItem';
import { Loading } from '../../common/Loading';

interface NotificationListProps {
  notifications: Notification[];
  isLoading?: boolean;
  onNotificationClick?: (notification: Notification) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  isLoading,
  onNotificationClick,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loading />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-4xl mb-2">📭</p>
        <p className="text-sm">No notifications</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClick={() => onNotificationClick?.(notification)}
        />
      ))}
    </div>
  );
};