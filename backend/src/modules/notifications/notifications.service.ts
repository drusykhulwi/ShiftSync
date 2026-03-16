// backend/src/modules/notifications/notifications.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { CreateNotificationDto, CreateBulkNotificationDto } from './dto/create-notification.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { ERROR_CODES } from '../../common/constants/error-codes.constants';
import { NOTIFICATION_TYPES } from '../../common/constants/notification.constants';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  // ========== CREATE NOTIFICATIONS ==========

  async create(createNotificationDto: CreateNotificationDto) {
    const { userId, type, title, message, data, priority } = createNotificationDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPrefs: true },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user wants this type of notification
    const prefs = user.notificationPrefs as any;
    if (prefs.types && prefs.types[type] === false) {
      // User has disabled this notification type
      return null;
    }

    // Create notification
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {},
        priority: priority || 1,
      },
    });

    const response = new NotificationResponseDto(notification);

    // Send real-time notification via WebSocket
    if (prefs.inApp !== false) {
      this.notificationsGateway.sendToUser(userId, 'new_notification', response);
      
      // Update unread count
      const unreadCount = await this.getUnreadCount(userId);
      this.notificationsGateway.sendToUser(userId, 'unread_count', { count: unreadCount });
    }

    // TODO: Send email if user has email notifications enabled
    if (prefs.email) {
      // Queue email sending
    }

    // TODO: Send push notification if user has push enabled
    if (prefs.push) {
      // Queue push notification
    }

    return response;
  }

  async createBulk(createBulkNotificationDto: CreateBulkNotificationDto) {
    const { userIds, type, title, message, data, priority } = createBulkNotificationDto;

    // Get all users' preferences
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, notificationPrefs: true },
    });

    // Create notifications in bulk
    const notifications = await this.prisma.$transaction(
      users.map(user =>
        this.prisma.notification.create({
          data: {
            userId: user.id,
            type,
            title,
            message,
            data: data || {},
            priority: priority || 1,
          },
        })
      )
    );

    // Send real-time notifications
    for (const user of users) {
      const userNotifications = notifications.filter(n => n.userId === user.id);
      const prefs = user.notificationPrefs as any;
      
      if (prefs.inApp !== false && userNotifications.length > 0) {
        // Send each notification
        for (const notification of userNotifications) {
          this.notificationsGateway.sendToUser(
            user.id,
            'new_notification',
            new NotificationResponseDto(notification)
          );
        }
        
        // Update unread count
        const unreadCount = await this.getUnreadCount(user.id);
        this.notificationsGateway.sendToUser(user.id, 'unread_count', { count: unreadCount });
      }
    }

    return notifications.map(n => new NotificationResponseDto(n));
  }

  // ========== FIND NOTIFICATIONS ==========

  async findAllForUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      data: notifications.map(n => new NotificationResponseDto(n)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async findUnreadForUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId, isRead: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data: notifications.map(n => new NotificationResponseDto(n)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async findOne(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Notification not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    return new NotificationResponseDto(notification);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  // ========== UPDATE NOTIFICATIONS ==========

  async markAsRead(id: string, userId: string) {
    const notification = await this.findOne(id, userId);

    if (notification.isRead) {
      return notification;
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return new NotificationResponseDto(updated);
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'All notifications marked as read',
      timestamp: new Date().toISOString(),
    };
  }

  async archive(id: string, userId: string) {
    await this.findOne(id, userId);

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isArchived: true,
      },
    });

    return new NotificationResponseDto(updated);
  }

  // ========== NOTIFICATION PREFERENCES ==========

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPrefs: true },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    return user.notificationPrefs;
  }

  async updatePreferences(userId: string, updatePrefsDto: UpdatePreferencesDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const currentPrefs = (user.notificationPrefs as any) || {};
    const updatedPrefs = {
      ...currentPrefs,
      ...updatePrefsDto,
    };

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        notificationPrefs: updatedPrefs,
      },
      select: { notificationPrefs: true },
    });

    return updatedUser.notificationPrefs;
  }

  // ========== CLEANUP ==========

  async deleteOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { count } = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
        isArchived: true,
      },
    });

    return {
      success: true,
      message: `Deleted ${count} old notifications`,
      timestamp: new Date().toISOString(),
    };
  }

  // ========== NOTIFICATION TEMPLATES ==========

  async sendShiftAssigned(userId: string, shiftId: string, shiftTitle: string, startTime: Date) {
    return this.create({
      userId,
      type: NOTIFICATION_TYPES.SHIFT_ASSIGNED,
      title: 'New Shift Assignment',
      message: `You have been assigned to "${shiftTitle}" on ${startTime.toLocaleDateString()}`,
      data: { shiftId, startTime },
      priority: 2, // High priority
    });
  }

  async sendShiftChanged(userId: string, shiftId: string, shiftTitle: string) {
    return this.create({
      userId,
      type: NOTIFICATION_TYPES.SHIFT_CHANGED,
      title: 'Shift Updated',
      message: `Shift "${shiftTitle}" has been updated`,
      data: { shiftId },
      priority: 2,
    });
  }

  async sendShiftCancelled(userId: string, shiftId: string, shiftTitle: string) {
    return this.create({
      userId,
      type: NOTIFICATION_TYPES.SHIFT_CANCELLED,
      title: 'Shift Cancelled',
      message: `Shift "${shiftTitle}" has been cancelled`,
      data: { shiftId },
      priority: 2,
    });
  }

  async sendSwapRequested(requesterId: string, responderId: string, shiftId: string) {
    // Notify responder
    await this.create({
      userId: responderId,
      type: NOTIFICATION_TYPES.SWAP_REQUESTED,
      title: 'Swap Request',
      message: 'Someone wants to swap shifts with you',
      data: { requesterId, shiftId },
      priority: 2,
    });

    // Notify managers
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      select: { locationId: true },
    });

    if (shift) {
      const managers = await this.prisma.user.findMany({
        where: {
          role: 'MANAGER',
          managedLocations: { some: { id: shift.locationId } },
        },
      });

      for (const manager of managers) {
        await this.create({
          userId: manager.id,
          type: NOTIFICATION_TYPES.SWAP_REQUESTED,
          title: 'Swap Request Pending',
          message: 'A swap request needs your approval',
          data: { requesterId, responderId, shiftId },
          priority: 1,
        });
      }
    }
  }

  async sendSwapApproved(userId: string, shiftId: string) {
    return this.create({
      userId,
      type: NOTIFICATION_TYPES.SWAP_APPROVED,
      title: 'Swap Approved',
      message: 'Your shift swap has been approved',
      data: { shiftId },
      priority: 2,
    });
  }

  async sendOvertimeWarning(userId: string, hours: number, weekStart: Date) {
    return this.create({
      userId,
      type: NOTIFICATION_TYPES.OVERTIME_WARNING,
      title: 'Overtime Warning',
      message: `You are approaching overtime (${hours.toFixed(1)} hours this week)`,
      data: { hours, weekStart },
      priority: 2,
    });
  }

  async sendSchedulePublished(userId: string, weekStart: Date) {
    return this.create({
      userId,
      type: NOTIFICATION_TYPES.SCHEDULE_PUBLISHED,
      title: 'Schedule Published',
      message: `Your schedule for the week of ${weekStart.toLocaleDateString()} has been published`,
      data: { weekStart },
      priority: 1,
    });
  }

  async sendCertificationExpiring(userId: string, skillName: string, expiryDate: Date) {
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return this.create({
      userId,
      type: NOTIFICATION_TYPES.CERTIFICATION_EXPIRING,
      title: 'Certification Expiring Soon',
      message: `Your ${skillName} certification expires in ${daysUntilExpiry} days`,
      data: { skillName, expiryDate, daysUntilExpiry },
      priority: 2,
    });
  }
}