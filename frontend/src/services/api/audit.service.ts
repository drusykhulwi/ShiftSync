// frontend/src/services/api/audit.service.ts
import apiClient from './client';
import type { 
  AuditLog,
  AuditLogResponse, 
  AuditLogFilters, 
  AuditStats,
  UserActivity,
  EntityHistory 
} from '../../types/audit.types';

export const auditService = {
  // Get audit logs with filters
  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogResponse> {
    const params: any = { ...filters };
    
    // Convert dates to strings if they're Date objects
    if (params.startDate instanceof Date) {
      params.startDate = params.startDate.toISOString();
    }
    if (params.endDate instanceof Date) {
      params.endDate = params.endDate.toISOString();
    }
    
    const response = await apiClient.get('/audit', { params });
    return response.data;
  },

  // Get audit log by ID
  async getAuditLogById(id: string): Promise<{ data: AuditLog }> {
    const response = await apiClient.get(`/audit/${id}`);
    return response.data;
  },

  // Get audit statistics
  async getAuditStats(startDate: string, endDate: string): Promise<AuditStats> {
    const response = await apiClient.get('/audit/stats', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get user activity
  async getUserActivity(userId: string, days: number = 30): Promise<UserActivity> {
    const response = await apiClient.get(`/audit/user/${userId}`, {
      params: { days }
    });
    return response.data;
  },

  // Get entity history
  async getEntityHistory(entityType: string, entityId: string): Promise<EntityHistory> {
    const response = await apiClient.get(`/audit/entity/${entityType}/${entityId}`);
    return response.data;
  },

  // Export audit logs
  async exportAuditLogs(filters: AuditLogFilters, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const response = await apiClient.get('/audit/export', {
      params: { ...filters, format },
      responseType: 'blob'
    });
    return response.data;
  },

  // Clean up old logs (admin only)
  async deleteOldLogs(days: number = 90): Promise<{ message: string }> {
    const response = await apiClient.delete('/audit/cleanup', {
      params: { days }
    });
    return response.data;
  },

  // Archive old logs (admin only)
  async archiveOldLogs(days: number = 365): Promise<{ message: string }> {
    const response = await apiClient.post('/audit/archive', null, {
      params: { days }
    });
    return response.data;
  }
};