// frontend/src/pages/notifications/index.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { Tabs } from '../../src/components/common/Tabs';
import { NotificationList } from '../../src/components/notifications/NotificationCenter/NotificationList';
import { NotificationPreferences } from '../../src/components/notifications/NotificationPreferences/NotificationPreferences';
import { Button } from '../../src/components/common/Button';
import { useAuth } from '../../src/hooks/useAuth';
import { useNotifications } from '../../src/hooks/useNotifications';
import { notificationsService } from '../../src/services/api/notifications.service';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { notifications, unreadCount, refresh, markAllAsRead, isConnected } = useNotifications();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const tabs = [
    {
      id: 'all',
      label: `All (${notifications.length})`,
      content: (
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          <NotificationList
            notifications={filteredNotifications}
            onNotificationClick={async (notification) => {
              if (!notification.isRead) {
                await notificationsService.markAsRead(notification.id);
                refresh();
              }
            }}
          />
        </div>
      ),
    },
    {
      id: 'unread',
      label: `Unread (${unreadCount})`,
      content: (
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          <NotificationList
            notifications={filteredNotifications}
            onNotificationClick={async (notification) => {
              if (!notification.isRead) {
                await notificationsService.markAsRead(notification.id);
                refresh();
              }
            }}
          />
        </div>
      ),
    },
    {
      id: 'preferences',
      label: 'Preferences',
      content: <NotificationPreferences />,
    },
  ];

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">
              WebSocket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </p>
          </div>
          {unreadCount > 0 && activeTab !== 'preferences' && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>

        <Tabs tabs={tabs} defaultTab="all" onChange={setActiveTab} />
      </div>
    </Layout>
  );
}