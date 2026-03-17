// frontend/src/services/api/locations.service.ts
import apiClient from './client';
import { Location, CreateLocationDto, UpdateLocationDto, LocationStats } from '../../types/location.types';

export const locationsService = {
  async getLocations(params?: { 
    page?: number; 
    limit?: number; 
    includeInactive?: boolean 
  }) {
    const response = await apiClient.get('/locations', { params });
    return response.data;
  },

  async getLocationById(id: string): Promise<{ data: Location }> {
    const response = await apiClient.get(`/locations/${id}`);
    return response.data;
  },

  async getMyLocations(): Promise<{ data: Location[] }> {
    const response = await apiClient.get('/locations/my-locations');
    return response.data;
  },

  async getLocationStats(id: string): Promise<LocationStats> {
    const response = await apiClient.get(`/locations/stats/${id}`);
    return response.data;
  },

  async createLocation(data: CreateLocationDto): Promise<{ data: Location }> {
    const response = await apiClient.post('/locations', data);
    return response.data;
  },

  async updateLocation(id: string, data: UpdateLocationDto): Promise<{ data: Location }> {
    const response = await apiClient.patch(`/locations/${id}`, data);
    return response.data;
  },

  async deleteLocation(id: string): Promise<void> {
    await apiClient.delete(`/locations/${id}`);
  },

  async assignManager(locationId: string, managerId: string): Promise<void> {
    await apiClient.post(`/locations/${locationId}/managers/${managerId}`);
  },

  async removeManager(locationId: string, managerId: string): Promise<void> {
    await apiClient.delete(`/locations/${locationId}/managers/${managerId}`);
  },
};