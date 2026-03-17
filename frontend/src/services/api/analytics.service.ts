// frontend/src/services/api/analytics.service.ts
import apiClient from './client';
import { 
  OvertimeReport, 
  FairnessReport, 
  OvertimeProjection,
  OvertimeRisk,
  DateRange 
} from '../../types/analytics.types';

export const analyticsService = {
  // Overtime Reports
  async getOvertimeReport(data: {
    locationId?: string;
    userId?: string;
    startDate: string;
    endDate: string;
    groupBy?: 'DAY' | 'WEEK' | 'MONTH';
  }): Promise<OvertimeReport> {
    const response = await apiClient.post('/overtime/reports/overtime', data);
    return response.data;
  },

  // Fairness Reports
  async getFairnessReport(data: {
    locationId?: string;
    startDate: string;
    endDate: string;
    threshold?: number;
  }): Promise<FairnessReport> {
    const response = await apiClient.post('/overtime/reports/fairness', data);
    return response.data;
  },

  // Overtime Projections
  async getOvertimeProjections(
    locationId: string,
    startDate: string,
    endDate: string
  ): Promise<OvertimeProjection> {
    const response = await apiClient.get('/overtime/reports/projections', {
      params: { locationId, startDate, endDate }
    });
    return response.data;
  },

  // Overtime Risks
  async getOvertimeRisks(locationId: string): Promise<{
    period: DateRange;
    totalShifts: number;
    totalStaff: number;
    risks: OvertimeRisk[];
    recommendations: string[];
  }> {
    const response = await apiClient.get('/overtime/reports/risks', {
      params: { locationId }
    });
    return response.data;
  },

  // Export Reports
  async exportReport(
    type: 'overtime' | 'fairness',
    params: any,
    format: 'json' | 'csv' = 'json'
  ): Promise<Blob> {
    const response = await apiClient.get(`/overtime/reports/export`, {
      params: { type, ...params, format },
      responseType: 'blob'
    });
    return response.data;
  }
};