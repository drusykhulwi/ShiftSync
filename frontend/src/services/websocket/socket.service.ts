import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../../config/api.config';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(API_CONFIG.WS_URL, {
      path: '/notifications',
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onNewNotification(callback: (notification: any) => void) {
    this.socket?.on('new_notification', callback);
  }

  onUnreadCount(callback: (data: { count: number }) => void) {
    this.socket?.on('unread_count', callback);
  }

  markAsRead(notificationId: string) {
    this.socket?.emit('mark_read', { notificationId });
  }

  markAllAsRead() {
    this.socket?.emit('mark_all_read');
  }
}

export const socketService = new SocketService();