// frontend/src/components/notifications/NotificationBadge/NotificationBadge.tsx
import React, { useState } from 'react';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationCenter } from '../NotificationCenter/NotificationCenter';

export const NotificationBadge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, isConnected } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-primary-500 focus:outline-none"
        title={isConnected ? 'Connected' : 'Reconnecting...'}
      >
        <span className="text-xl">🔔</span>
        {!isConnected && (
          <span className="absolute -top-1 -right-1 w-3 h-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
          </span>
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 z-50">
            <NotificationCenter onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};