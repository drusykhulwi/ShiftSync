import { User } from './auth.types';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  desiredHours?: number;
  locationIds?: string[];
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  desiredHours?: number;
  isActive?: boolean;
}

export interface Certification {
  id: string;
  userId: string;
  skillId: string;
  locationId: string;
  certifiedAt: string;
  expiresAt?: string;
  isActive: boolean;
  skill: {
    id: string;
    name: string;
    category: string;
  };
  location: {
    id: string;
    name: string;
  };
}

export interface Availability {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  exceptionDate?: string;
  isAvailable: boolean;
}