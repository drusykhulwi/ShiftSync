// frontend/src/components/common/Sidebar.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const router = useRouter();
  const { user, logout } = useAuth();

  const commonItems = [
    { href: '/profile', icon: '👤', label: 'Profile' },
    { href: '/notifications', icon: '🔔', label: 'Notifications' },
  ];

  const menuItems = {
    ADMIN: [
      { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
      { href: '/admin/users', icon: '👥', label: 'Users' },
      { href: '/locations', icon: '📍', label: 'Locations' },
      { href: '/schedule', icon: '📅', label: 'Schedule' },
      ...commonItems,
    ],
    MANAGER: [
      { href: '/manager/dashboard', icon: '📊', label: 'Dashboard' },
      { href: '/manager/schedule', icon: '📅', label: 'Schedule' },
      { href: '/manager/staff', icon: '👥', label: 'Staff' },
      { href: '/swaps', icon: '🔄', label: 'Swap Requests' },
      ...commonItems,
    ],
    STAFF: [
      { href: '/staff/dashboard', icon: '📊', label: 'Dashboard' },
      { href: '/staff/schedule', icon: '📅', label: 'My Schedule' },
      { href: '/staff/availability', icon: '⏰', label: 'Availability' },
      { href: '/swaps', icon: '🔄', label: 'Swap Requests' },
      ...commonItems,
    ],
  };

  const items = user ? menuItems[user.role] || [] : [];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-20 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full bg-white shadow-lg z-30
          transition-all duration-300
          ${isOpen ? 'w-64' : 'w-0 md:w-20'}
          overflow-hidden
        `}
      >
        <div className="flex items-center justify-between p-4 border-b min-w-[5rem]">
          {isOpen ? (
            <h1 className="text-xl font-bold text-primary-500 whitespace-nowrap">ShiftSync</h1>
          ) : (
            <h1 className="text-xl font-bold text-primary-500">SS</h1>
          )}
          <button onClick={onToggle} className="p-1 rounded-lg hover:bg-gray-100 flex-shrink-0">
            {isOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="p-4 overflow-y-auto h-[calc(100%-65px)]">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                // Close sidebar on mobile after navigation
                if (window.innerWidth < 768) onToggle();
              }}
              className={`flex items-center p-3 mb-2 rounded-lg transition-colors whitespace-nowrap ${
                router.pathname === item.href
                  ? 'bg-primary-50 text-primary-500'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {isOpen && <span className="ml-3 truncate">{item.label}</span>}
            </Link>
          ))}

          <button
            onClick={logout}
            className="flex items-center w-full p-3 mt-4 text-red-500 rounded-lg hover:bg-red-50 whitespace-nowrap"
          >
            <span className="text-xl flex-shrink-0">🚪</span>
            {isOpen && <span className="ml-3">Logout</span>}
          </button>
        </nav>
      </aside>
    </>
  );
};