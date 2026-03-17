// frontend/src/services/api/skills.service.ts
import apiClient from './client';

export const skillsService = {
  async getSkills(params?: { category?: string; page?: number; limit?: number }) {
    const response = await apiClient.get('/skills', { params });
    return response.data;
  },

  async getSkillById(id: string) {
    const response = await apiClient.get(`/skills/${id}`);
    return response.data;
  },

  async getSkillCategories() {
    const response = await apiClient.get('/skills/categories');
    return response.data;
  },

  async createSkill(data: { name: string; description?: string; category?: string }) {
    const response = await apiClient.post('/skills', data);
    return response.data;
  },

  async updateSkill(id: string, data: { name?: string; description?: string; category?: string }) {
    const response = await apiClient.patch(`/skills/${id}`, data);
    return response.data;
  },

  async deleteSkill(id: string) {
    await apiClient.delete(`/skills/${id}`);
  },
};