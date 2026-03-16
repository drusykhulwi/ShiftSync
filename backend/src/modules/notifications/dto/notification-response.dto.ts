// backend/src/modules/notifications/dto/notification-response.dto.ts
import { Expose } from 'class-transformer';

export class NotificationResponseDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  type: string;

  @Expose()
  title: string;

  @Expose()
  message: string;

  @Expose()
  data?: any;

  @Expose()
  isRead: boolean;

  @Expose()
  readAt?: Date | null;  // Allow null

  @Expose()
  priority: number;

  @Expose()
  createdAt: Date;

  constructor(partial: Partial<NotificationResponseDto>) {
    // Handle null values
    if (partial.readAt === null) partial.readAt = undefined;
    
    Object.assign(this, partial);
  }
}