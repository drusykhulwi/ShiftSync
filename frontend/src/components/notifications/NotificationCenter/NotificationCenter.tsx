// frontend/src/components/notifications/NotificationCenter/NotificationCenter.tsx
import React, { useEffect, useRef } from 'react';
import { NotificationList } from './NotificationList';
import { Button } from '../../common/Button';
import { useNotifications } from '../../../hooks/useNotifications';

interface NotificationCenterProps {
  onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    // Handle navigation based on notification type
    if (notification.data?.shiftId) {
      window.location.href = `/schedule/${notification.data.shiftId}`;
    } else if (notification.data?.swapRequestId) {
      window.location.href = '/swaps';
    }
    onClose?.();
  };

  return (
    <div
      ref={containerRef}
      className="w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
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
        {unreadCount > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-[500px] overflow-y-auto">
        <NotificationList
          notifications={notifications}
          isLoading={isLoading}
          onNotificationClick={handleNotificationClick}
        />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
        <button
          onClick={() => {
            window.location.href = '/notifications';
            onClose?.();
          }}
          className="text-sm text-primary-500 hover:text-primary-600"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};