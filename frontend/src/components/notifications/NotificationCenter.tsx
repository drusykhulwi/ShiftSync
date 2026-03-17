// frontend/src/components/notifications/NotificationCenter.tsx
import React, { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../hooks/useNotifications';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface NotificationCenterProps {
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = async (id: string) => {
    await markAsRead(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SHIFT_ASSIGNED':
        return '📋';
      case 'SHIFT_CHANGED':
        return '✏️';
      case 'SHIFT_CANCELLED':
        return '❌';
      case 'SWAP_REQUESTED':
        return '🔄';
      case 'SWAP_APPROVED':
        return '✅';
      case 'SWAP_DECLINED':
        return '❌';
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

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: // URGENT
        return 'bg-red-100 text-red-800 border-red-200';
      case 2: // HIGH
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 1: // NORMAL
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default: // LOW
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-96 max-h-[600px] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center border-b pb-3 mb-3">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">📭</p>
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                p-3 rounded-lg border cursor-pointer transition-colors
                ${notification.isRead 
                  ? 'bg-white border-gray-200 hover:bg-gray-50' 
                  : `${getPriorityColor(notification.priority)} hover:opacity-90`
                }
              `}
              onClick={() => handleNotificationClick(notification.id)}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1">
                  <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notification.isRead && (
                  <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};