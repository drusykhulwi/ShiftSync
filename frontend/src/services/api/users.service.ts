import apiClient from './client';
import { User } from '../../types/auth.types';
import { CreateUserDto, UpdateUserDto, Certification } from '../../types/user.types';

export const usersService = {
  async getUsers(params?: {
    role?: string;
    locationId?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  async getUserById(id: string): Promise<{ data: User }> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  async getProfile(): Promise<{ data: User }> {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<{ data: User }> {
    const response = await apiClient.patch('/users/profile', data);
    return response.data;
  },

  async createUser(data: CreateUserDto): Promise<{ data: User }> {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  async updateUser(id: string, data: UpdateUserDto): Promise<{ data: User }> {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  async getStaffByLocation(locationId: string): Promise<{ data: User[] }> {
    const response = await apiClient.get(`/users/staff/${locationId}`);
    return response.data;
  },

  async addCertification(userId: string, skillId: string, locationId: string): Promise<{ data: Certification }> {
    const response = await apiClient.post(`/users/${userId}/certifications`, {
      skillId,
      locationId,
    });
    return response.data;
  },

  async removeCertification(userId: string, certificationId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}/certifications/${certificationId}`);
  },
};