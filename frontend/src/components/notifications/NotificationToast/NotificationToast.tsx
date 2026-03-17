// frontend/src/components/notifications/NotificationToast/NotificationToast.tsx
import React, { useEffect } from 'react';
import { Notification } from '../../../types/notification.types';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  duration?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

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
      case 'SWAP_APPROVED':
        return '✅';
      case 'OVERTIME_WARNING':
        return '⚠️';
      default:
        return '📌';
    }
  };

  const getBgColor = () => {
    switch (notification.priority) {
      case 3:
        return 'bg-red-50 border-red-200';
      case 2:
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 w-96 p-4 rounded-lg shadow-lg border
        animate-slide-up ${getBgColor()}
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{getIcon()}</div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-gray-900">{notification.title}</h4>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        </div>
      </div>
    </div>
  );
};