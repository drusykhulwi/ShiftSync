// frontend/src/components/notifications/NotificationToast/ToastContainer.tsx
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useAuth } from '../../../hooks/useAuth';
import type { Notification } from '../../../types/notification.types';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// Global toast context so any component can trigger toasts
interface ToastContextValue {
  showToast: (message: string, type: Toast['type'], duration?: number) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: '📌',
  };

  return (
    <div
      className={`w-80 sm:w-96 p-4 rounded-lg shadow-lg border flex items-start space-x-3 ${styles[toast.type]}`}
    >
      <span className="text-lg flex-shrink-0">{icons[toast.type]}</span>
      <div className="flex-1 text-sm">{toast.message}</div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
        ✕
      </button>
    </div>
  );
};

// Notification toast (from WebSocket)
const NotificationItem: React.FC<{
  notification: Notification;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'SHIFT_ASSIGNED': return '📋';
      case 'SHIFT_CHANGED': return '✏️';
      case 'SHIFT_CANCELLED': return '❌';
      case 'SWAP_REQUESTED': return '🔄';
      case 'SWAP_APPROVED': return '✅';
      case 'OVERTIME_WARNING': return '⚠️';
      case 'SCHEDULE_PUBLISHED': return '📅';
      default: return '📌';
    }
  };

  const getBg = () => {
    switch (notification.priority) {
      case 3: return 'bg-red-50 border-red-200 text-red-800';
      case 2: return 'bg-orange-50 border-orange-200 text-orange-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`w-80 sm:w-96 p-4 rounded-lg shadow-lg border flex items-start space-x-3 ${getBg()}`}>
      <span className="text-lg flex-shrink-0">{getIcon()}</span>
      <div className="flex-1">
        <p className="font-semibold text-sm">{notification.title}</p>
        <p className="text-sm mt-0.5">{notification.message}</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
        ✕
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notificationToasts, setNotificationToasts] = useState<Notification[]>([]);
  const { token } = useAuth();
  const { on, off } = useWebSocket(token);

  const showToast = useCallback((message: string, type: Toast['type'], duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  useEffect(() => {
    const handleNewNotification = (notification: Notification) => {
      if (notification.priority >= 2) {
        setNotificationToasts(prev => [...prev, notification]);
      }
    };
    on('notification', handleNewNotification);
    return () => off('notification', handleNewNotification);
  }, [on, off]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {notificationToasts.map(n => (
          <NotificationItem
            key={n.id}
            notification={n}
            onClose={() => setNotificationToasts(prev => prev.filter(t => t.id !== n.id))}
          />
        ))}
        {toasts.map(t => (
          <ToastItem
            key={t.id}
            toast={t}
            onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};