// frontend/src/services/websocket/socket.service.ts
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../../config/api.config';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket...');
    
    this.socket = io(API_CONFIG.WS_URL, {
      path: '/notifications',
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.emit('connection_status', { status: 'connected' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.emit('connection_status', { status: 'disconnected', reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('connection_status', { status: 'error', error });
    });

    this.socket.on('new_notification', (data) => {
      console.log('📨 New notification received:', data);
      this.emit('notification', data);
    });

    this.socket.on('unread_count', (data) => {
      console.log('📊 Unread count update:', data);
      this.emit('unread_count', data);
    });

    this.socket.on('notification_read', (data) => {
      console.log('✅ Notification marked as read:', data);
      this.emit('notification_read', data);
    });

    this.socket.on('all_read', () => {
      console.log('✅ All notifications marked as read');
      this.emit('all_read');
    });

    this.socket.on('notifications_list', (data) => {
      console.log('📋 Notifications list received');
      this.emit('notifications_list', data);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('WebSocket disconnected');
    }
  }

  // Event listeners
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback?: Function) {
    if (callback) {
      const callbacks = this.listeners.get(event)?.filter(cb => cb !== callback);
      if (callbacks) {
        this.listeners.set(event, callbacks);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  private emit(event: string, data?: any) {
  const callbacks = this.listeners.get(event);
  if (callbacks) {
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }
}

  // WebSocket actions
  markAsRead(notificationId: string) {
    this.socket?.emit('mark_read', { notificationId });
  }

  markAllAsRead() {
    this.socket?.emit('mark_all_read');
  }

  getNotifications(page?: number, limit?: number) {
    this.socket?.emit('get_notifications', { page, limit });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();