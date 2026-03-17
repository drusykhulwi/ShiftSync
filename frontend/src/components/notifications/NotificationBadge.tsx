import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationCenter } from './NotificationCenter';

export const NotificationBadge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, refresh } = useNotifications();

  // Refresh notifications periodically
  useEffect(() => {
    const interval = setInterval(refresh, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-primary-500 focus:outline-none"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 z-50">
            <NotificationCenter onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};