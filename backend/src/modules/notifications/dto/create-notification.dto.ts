// backend/src/modules/notifications/dto/create-notification.dto.ts
import { IsString, IsEnum, IsOptional, IsObject, IsNumber, Min, Max } from 'class-validator';
import { NOTIFICATION_TYPES } from '../../../common/constants/notification.constants';

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(NOTIFICATION_TYPES)  // Use the enum values, not the type
  type: NOTIFICATION_TYPES;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(3)
  priority?: number = 1;
}

export class CreateBulkNotificationDto {
  @IsString({ each: true })
  userIds: string[];

  @IsEnum(NOTIFICATION_TYPES)  // Use the enum values
  type: NOTIFICATION_TYPES;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(3)
  priority?: number = 1;
}