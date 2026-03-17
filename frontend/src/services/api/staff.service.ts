// frontend/src/services/api/staff.service.ts
import apiClient from './client';
import { StaffMember } from '../../types/staff.types';

export const staffService = {
  async getStaff(params?: {
    locationId?: string;
    skillId?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/users', { 
      params: { ...params, role: 'STAFF' } 
    });
    return response.data;
  },

  async getStaffById(id: string): Promise<{ data: StaffMember }> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  async getStaffByLocation(locationId: string) {
    const response = await apiClient.get(`/users/staff/${locationId}`);
    return response.data;
  },

  async updateStaff(id: string, data: Partial<StaffMember>) {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
  },

  async addCertification(userId: string, data: { skillId: string; locationId: string; expiresAt?: Date }) {
    const response = await apiClient.post(`/users/${userId}/certifications`, data);
    return response.data;
  },

  async removeCertification(userId: string, certificationId: string) {
    await apiClient.delete(`/users/${userId}/certifications/${certificationId}`);
  },
};