// backend/src/modules/users/dto/user-response.dto.ts
import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  role: string;

  @Expose()
  phone?: string | null;  // Allow null

  @Expose()
  isActive: boolean;

  @Expose()
  desiredHours?: number | null;

  @Expose()
  notificationPrefs: any;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  locations?: any[];

  @Expose()
  certifications?: any[];

  @Exclude()
  password: string;

  @Exclude()
  refreshToken?: string | null;

  constructor(partial: Partial<UserResponseDto>) {
    // Handle null values by converting to undefined if needed
    if (partial.phone === null) partial.phone = undefined;
    if (partial.desiredHours === null) partial.desiredHours = undefined;
    if (partial.refreshToken === null) partial.refreshToken = undefined;
    
    Object.assign(this, partial);
  }
}