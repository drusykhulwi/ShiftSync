// frontend/src/types/staff.types.ts
export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  certifications: {
    id: string;
    skillId: string;
    skillName: string;
    locationId: string;
    certifiedAt: string;
    expiresAt?: string;
  }[];
  availabilities: {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
  }[];
}