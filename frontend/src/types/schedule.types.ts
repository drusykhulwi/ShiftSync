// frontend/src/types/schedule.types.ts
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  locationId: string;
  locationName: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
  requirements: {
    skillId: string;
    skillName: string;
    headcount: number;
    assigned: number;
  }[];
  assignedStaff?: {
    id: string;
    name: string;
    role: string;
  }[];
  color?: string;
}

export interface CalendarView {
  type: 'day' | 'week' | 'month';
  date: Date;
}

export interface TimeSlot {
  day: number;
  hour: number;
  minute: number;
}