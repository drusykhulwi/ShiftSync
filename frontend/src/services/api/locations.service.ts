// frontend/src/services/api/locations.service.ts
import apiClient from './client';

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  timezone: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export const locationsService = {
  async getLocations(params?: { page?: number; limit?: number; includeInactive?: boolean }) {
    const response = await apiClient.get('/locations', { params });
    return response.data;
  },

  async getLocationById(id: string) {
    const response = await apiClient.get(`/locations/${id}`);
    return response.data;
  },

  async getMyLocations() {
    const response = await apiClient.get('/locations/my-locations');
    return response.data;
  },

  async getLocationStats(id: string) {
    const response = await apiClient.get(`/locations/stats/${id}`);
    return response.data;
  },

  async createLocation(data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) {
    const response = await apiClient.post('/locations', data);
    return response.data;
  },

  async updateLocation(id: string, data: Partial<Location>) {
    const response = await apiClient.patch(`/locations/${id}`, data);
    return response.data;
  },

  async deleteLocation(id: string) {
    await apiClient.delete(`/locations/${id}`);
  },

  async assignManager(locationId: string, managerId: string) {
    const response = await apiClient.post(`/locations/${locationId}/managers/${managerId}`, {});
    return response.data;
  },

  async removeManager(locationId: string, managerId: string) {
    await apiClient.delete(`/locations/${locationId}/managers/${managerId}`);
  },
};