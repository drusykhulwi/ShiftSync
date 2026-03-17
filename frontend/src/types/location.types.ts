// frontend/src/types/location.types.ts
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  timezone: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface LocationStats {
  locationId: string;
  locationName: string;
  stats: {
    totalStaff: number;
    totalManagers: number;
    todayShifts: number;
    upcomingShifts: number;
    completedShifts: number;
  };
}

export interface CreateLocationDto {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  timezone: string;
  phone?: string;
  email?: string;
}

export interface UpdateLocationDto {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  timezone?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}