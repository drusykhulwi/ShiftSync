export interface Shift {
  id: string;
  locationId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
  publishedAt?: string;
  cutoffHours: number;
  createdAt: string;
  updatedAt: string;
  location?: {
    id: string;
    name: string;
    timezone: string;
  };
  requirements?: ShiftRequirement[];
  assignedCount?: number;
  openSpots?: number;
}

export interface ShiftRequirement {
  id: string;
  skillId: string;
  headcount: number;
  priority: number;
  skill: {
    id: string;
    name: string;
    category: string;
  };
  assignments?: ShiftAssignment[];
  assignedCount?: number;
}

export interface ShiftAssignment {
  id: string;
  userId: string;
  shiftId: string;
  requirementId: string;
  isPrimary: boolean;
  clockedInAt?: string;
  clockedOutAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateShiftDto {
  locationId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  requirements: {
    skillId: string;
    headcount: number;
    priority?: number;
  }[];
}

export interface AssignStaffDto {
  userId: string;
  requirementId: string;
  isPrimary?: boolean;
}