// backend/src/modules/notifications/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor(
    private notificationsService: NotificationsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Authenticate user from token
      const token = client.handshake.auth.token || client.handshake.headers.authorization;
      
      if (!token) {
        this.logger.warn('Client connected without token');
        client.disconnect();
        return;
      }

      const tokenString = token.replace('Bearer ', '');
      const payload = this.jwtService.verify(tokenString, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const userId = payload.sub;
      
      // Store socket connection
      const existingSockets = this.userSockets.get(userId) || [];
      this.userSockets.set(userId, [...existingSockets, client.id]);
      
      // Join user to their room
      client.join(`user:${userId}`);
      
      // Join role-based room
      client.join(`role:${payload.role}`);
      
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
      
      // Send unread count on connection
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      client.emit('unread_count', { count: unreadCount });
      
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Remove socket from userSockets map
    for (const [userId, socketIds] of this.userSockets.entries()) {
      const updatedSockets = socketIds.filter(id => id !== client.id);
      if (updatedSockets.length === 0) {
        this.userSockets.delete(userId);
      } else {
        this.userSockets.set(userId, updatedSockets);
      }
    }
    
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    try {
      const userId = this.getUserIdFromSocket(client);
      await this.notificationsService.markAsRead(data.notificationId, userId);
      
      // Notify client that notification was read
      client.emit('notification_read', { id: data.notificationId });
      
      // Update unread count
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      client.emit('unread_count', { count: unreadCount });
      
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('mark_all_read')
  async handleMarkAllRead(@ConnectedSocket() client: Socket) {
    try {
      const userId = this.getUserIdFromSocket(client);
      await this.notificationsService.markAllAsRead(userId);
      
      // Notify client
      client.emit('all_read');
      client.emit('unread_count', { count: 0 });
      
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('get_notifications')
  async handleGetNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { page?: number; limit?: number },
  ) {
    try {
      const userId = this.getUserIdFromSocket(client);
      const notifications = await this.notificationsService.findAllForUser(
        userId,
        data.page || 1,
        data.limit || 20,
      );
      
      client.emit('notifications_list', notifications);
      
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Public methods for sending notifications

  async sendToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  async sendToRole(role: string, event: string, payload: any) {
    this.server.to(`role:${role}`).emit(event, payload);
  }

  async sendToAll(event: string, payload: any) {
    this.server.emit(event, payload);
  }

  async sendToMany(userIds: string[], event: string, payload: any) {
    userIds.forEach(userId => {
      this.server.to(`user:${userId}`).emit(event, payload);
    });
  }

  private getUserIdFromSocket(client: Socket): string {
    // Extract user ID from socket data or token
    // This is simplified - in reality you'd store user data in client.handshake
    const rooms = Array.from(client.rooms);
    const userRoom = rooms.find(room => room.startsWith('user:'));
    
    if (!userRoom) {
      throw new Error('User not authenticated');
    }
    
    return userRoom.replace('user:', '');
  }
}