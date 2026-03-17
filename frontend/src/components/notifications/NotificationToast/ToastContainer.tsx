// frontend/src/components/notifications/NotificationToast/ToastContainer.tsx
import React, { useState, useEffect } from 'react';
import { NotificationToast } from './NotificationToast';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useAuth } from '../../../hooks/useAuth';
import type { Notification } from '../../../types/notification.types';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Notification[]>([]);
  const { token } = useAuth();
  const { on, off } = useWebSocket(token);

  useEffect(() => {
    const handleNewNotification = (notification: Notification) => {
      // Only show toasts for high priority notifications
      if (notification.priority >= 2) {
        setToasts(prev => [...prev, notification]);
      }
    };

    on('notification', handleNewNotification);

    return () => {
      off('notification', handleNewNotification);
    };
  }, [on, off]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          notification={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};