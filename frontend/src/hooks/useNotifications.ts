// frontend/src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { notificationsService } from '../services/api/notifications.service';
import { socketService } from '../services/websocket/socket.service'; // Add this import
import type { Notification } from '../types/notification.types'; // Change to type-only import
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const { isConnected, on, off, markAsRead, markAllAsRead } = useWebSocket(token);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await notificationsService.getNotifications();
      setNotifications(response.data || []);
      
      const countResponse = await notificationsService.getUnreadCount();
      setUnreadCount(countResponse.count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsService.getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Handle new notification
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show browser notification if supported
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new window.Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
      });
    }
  }, []);

  // Handle unread count update
  const handleUnreadCount = useCallback((data: { count: number }) => {
    setUnreadCount(data.count);
  }, []);

  // Handle notification read
  const handleNotificationRead = useCallback((data: { id: string }) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === data.id
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n
      )
    );
  }, []);

  // Handle all read
  const handleAllRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);
  }, []);

  // Handle notifications list
  const handleNotificationsList = useCallback((data: { data: Notification[] }) => {
    setNotifications(data.data);
  }, []);

  // Setup WebSocket listeners
  useEffect(() => {
    if (!user || !isConnected) return;

    on('notification', handleNewNotification);
    on('unread_count', handleUnreadCount);
    on('notification_read', handleNotificationRead);
    on('all_read', handleAllRead);
    on('notifications_list', handleNotificationsList);

    // Request initial notifications
    socketService.getNotifications();

    return () => {
      off('notification', handleNewNotification);
      off('unread_count', handleUnreadCount);
      off('notification_read', handleNotificationRead);
      off('all_read', handleAllRead);
      off('notifications_list', handleNotificationsList);
    };
  }, [user, isConnected, on, off]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const toggleNotifications = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      markAsRead(id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationsService.markAllAsRead();
      markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [markAllAsRead]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isOpen,
    isConnected,
    toggleNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    refresh: fetchNotifications,
    refreshUnreadCount,
  };
};