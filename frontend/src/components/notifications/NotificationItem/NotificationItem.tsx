// frontend/src/components/notifications/NotificationItem/NotificationItem.tsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '../../../types/notification.types';
import { Avatar } from '../../common/Avatar';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'SHIFT_ASSIGNED':
        return '📋';
      case 'SHIFT_CHANGED':
        return '✏️';
      case 'SHIFT_CANCELLED':
        return '❌';
      case 'SWAP_REQUESTED':
        return '🔄';
      case 'SWAP_ACCEPTED':
        return '✅';
      case 'SWAP_DECLINED':
        return '❌';
      case 'SWAP_APPROVED':
        return '👍';
      case 'DROP_REQUESTED':
        return '📤';
      case 'OVERTIME_WARNING':
        return '⚠️';
      case 'SCHEDULE_PUBLISHED':
        return '📅';
      case 'CERTIFICATION_EXPIRING':
        return '🎫';
      default:
        return '📌';
    }
  };

  const getPriorityClass = () => {
    switch (notification.priority) {
      case 3: // URGENT
        return 'bg-red-50 border-red-200';
      case 2: // HIGH
        return 'bg-orange-50 border-orange-200';
      case 1: // NORMAL
        return 'bg-blue-50 border-blue-200';
      default: // LOW
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-4 border-b last:border-b-0 cursor-pointer transition-colors
        ${!notification.isRead ? getPriorityClass() : 'hover:bg-gray-50'}
        ${!notification.isRead ? 'border-l-4 border-l-primary-500' : ''}
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-gray-900`}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            {notification.priority === 3 && (
              <span className="text-xs text-red-500 font-medium">Urgent</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};