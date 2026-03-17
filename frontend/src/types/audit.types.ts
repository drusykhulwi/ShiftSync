// frontend/src/types/audit.types.ts
export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'ASSIGN' 
  | 'UNSIGN' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'PUBLISH' 
  | 'UNPUBLISH' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'EXPORT';

export interface AuditLog {
  id: string;
  actorId?: string;
  actor?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  action: AuditAction;
  entityType: string;
  entityId: string;
  beforeState?: any;
  afterState?: any;
  changes?: Record<string, { before: any; after: any }>;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  createdAt: string;
}

export interface AuditLogFilters {
  actorId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResponse {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface AuditStats {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  totalLogs: number;
  actionCounts: Record<AuditAction, number>;
  entityCounts: Record<string, number>;
  dailyCounts: Record<string, number>;
  topActors: Array<{ actorId: string; count: number }>;
  averagePerDay: number;
}

export interface UserActivity {
  userId: string;
  period: string;
  totalActions: number;
  actionSummary: Record<AuditAction, number>;
  dailyActivity: Record<string, Array<{
    action: AuditAction;
    entityType: string;
    entityId: string;
    time: string;
  }>>;
  lastActive: string | null;
}

export interface EntityHistory {
  entityType: string;
  entityId: string;
  totalEvents: number;
  firstEvent: string | null;
  lastEvent: string | null;
  timeline: Array<{
    timestamp: string;
    action: AuditAction;
    actor: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    changes: any;
    beforeState: any;
    afterState: any;
  }>;
}