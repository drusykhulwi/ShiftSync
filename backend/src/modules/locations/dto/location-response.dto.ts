// backend/src/modules/locations/dto/location-response.dto.ts
import { Exclude, Expose } from 'class-transformer';


export class LocationResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  address: string;

  @Expose()
  city: string;

  @Expose()
  state: string;

  @Expose()
  zipCode: string;

  @Expose()
  country: string;

  @Expose()
  timezone: string;

  @Expose()
  phone?: string | null;

  @Expose()
  email?: string | null;

  @Expose()
  isActive: boolean;

  @Expose()
  metadata?: any; // Use 'any' instead of complex types

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  managerCount?: number;

  @Expose()
  staffCount?: number;

  @Expose()
  shiftCount?: number;

  constructor(partial: Partial<LocationResponseDto>) {
    // Handle null values
    if (partial.phone === null) partial.phone = undefined;
    if (partial.email === null) partial.email = undefined;
    
    Object.assign(this, partial);
  }
}