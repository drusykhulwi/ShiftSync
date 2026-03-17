import apiClient from './client';
import { Notification, NotificationPreferences } from '../../types/notification.types';

export const notificationsService = {
  async getNotifications(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  async getUnreadNotifications(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get('/notifications/unread', { params });
    return response.data;
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await apiClient.get('/notifications/unread/count');
    return response.data;
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get('/notifications/preferences');
    return response.data;
  },

  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await apiClient.patch('/notifications/preferences', prefs);
    return response.data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await apiClient.patch(`/notifications/${id}/read`, {});
    return response.data;
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/read-all');
  },

  async archive(id: string): Promise<Notification> {
    const response = await apiClient.patch(`/notifications/${id}/archive`, {});
    return response.data;
  },
};