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

  const menuItems = {
    ADMIN: [
      { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
      { href: '/admin/users', icon: '👥', label: 'Users' },
      { href: '/admin/locations', icon: '📍', label: 'Locations' },
      { href: '/admin/schedule', icon: '📅', label: 'Schedule' },
      { href: '/admin/reports', icon: '📈', label: 'Reports' },
    ],
    MANAGER: [
      { href: '/manager/dashboard', icon: '📊', label: 'Dashboard' },
      { href: '/manager/schedule', icon: '📅', label: 'Schedule' },
      { href: '/manager/staff', icon: '👥', label: 'Staff' },
      { href: '/manager/shifts', icon: '⏰', label: 'Shifts' },
      { href: '/manager/requests', icon: '🔄', label: 'Requests' },
    ],
    STAFF: [
      { href: '/staff/dashboard', icon: '📊', label: 'Dashboard' },
      { href: '/staff/schedule', icon: '📅', label: 'My Schedule' },
      { href: '/staff/availability', icon: '⏰', label: 'Availability' },
      { href: '/staff/swaps', icon: '🔄', label: 'Swap Requests' },
    ],
  };

  const items = user ? menuItems[user.role] : [];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-30 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {isOpen ? (
          <h1 className="text-xl font-bold text-primary-500">ShiftSync</h1>
        ) : (
          <h1 className="text-xl font-bold text-primary-500">SS</h1>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-gray-100"
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      <nav className="p-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center p-3 mb-2 rounded-lg transition-colors ${
              router.pathname === item.href
                ? 'bg-primary-50 text-primary-500'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {isOpen && <span className="ml-3">{item.label}</span>}
          </Link>
        ))}

        <button
          onClick={logout}
          className="flex items-center w-full p-3 mt-4 text-red-500 rounded-lg hover:bg-red-50"
        >
          <span className="text-xl">🚪</span>
          {isOpen && <span className="ml-3">Logout</span>}
        </button>
      </nav>
    </aside>
  );
};