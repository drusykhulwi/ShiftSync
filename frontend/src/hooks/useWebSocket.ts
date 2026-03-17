// frontend/src/hooks/useWebSocket.ts
import { useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/websocket/socket.service';

interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  reason?: string;
  error?: any;
}

export const useWebSocket = (token?: string | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'connecting',
  });

  useEffect(() => {
    if (!token) {
      console.log('No token provided, not connecting to WebSocket');
      return;
    }

    console.log('Setting up WebSocket connection...');
    socketService.connect(token);
    setIsConnected(true);
    setConnectionStatus({ status: 'connected' });

    const handleStatus = (status: ConnectionStatus) => {
      setConnectionStatus(status);
      setIsConnected(status.status === 'connected');
    };

    socketService.on('connection_status', handleStatus);

    return () => {
      socketService.off('connection_status', handleStatus);
    };
  }, [token]);

  const on = useCallback((event: string, callback: Function) => {
    socketService.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback?: Function) => {
    socketService.off(event, callback);
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    socketService.markAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(() => {
    socketService.markAllAsRead();
  }, []);

  const getNotifications = useCallback((page?: number, limit?: number) => {
    socketService.getNotifications(page, limit);
  }, []);

  return {
    isConnected,
    connectionStatus,
    on,
    off,
    markAsRead,
    markAllAsRead,
    getNotifications,
  };
};