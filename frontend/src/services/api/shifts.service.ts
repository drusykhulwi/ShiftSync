import apiClient from './client';
import { Shift, CreateShiftDto, AssignStaffDto } from '../../types/shift.types';

export const shiftsService = {
  async getShifts(params?: {
    locationId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/shifts', { params });
    return response.data;
  },

  async getShiftById(id: string): Promise<{ data: Shift }> {
    const response = await apiClient.get(`/shifts/${id}`);
    return response.data;
  },

  async getShiftsByLocation(locationId: string, startDate?: string, endDate?: string) {
    const response = await apiClient.get(`/shifts/location/${locationId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async createShift(data: CreateShiftDto): Promise<{ data: Shift }> {
    const response = await apiClient.post('/shifts', data);
    return response.data;
  },

  async updateShift(id: string, data: Partial<CreateShiftDto>): Promise<{ data: Shift }> {
    const response = await apiClient.patch(`/shifts/${id}`, data);
    return response.data;
  },

  async deleteShift(id: string): Promise<void> {
    await apiClient.delete(`/shifts/${id}`);
  },

  async assignStaff(shiftId: string, data: AssignStaffDto): Promise<any> {
    const response = await apiClient.post(`/shifts/${shiftId}/assign`, data);
    return response.data;
  },

  async unassignStaff(shiftId: string, assignmentId: string): Promise<void> {
    await apiClient.delete(`/shifts/${shiftId}/assign/${assignmentId}`);
  },

  async publishShifts(shiftIds: string[], message?: string): Promise<any> {
    const response = await apiClient.post('/shifts/publish', { shiftIds, message });
    return response.data;
  },

  async checkConflicts(userId: string, startDate: string, endDate: string): Promise<any> {
    const response = await apiClient.get(`/shifts/conflicts/${userId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
};