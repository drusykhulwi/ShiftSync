// frontend/src/services/api/swap-requests.service.ts
import apiClient from './client';
import { 
  SwapRequest, 
  CreateSwapRequestDto, 
  RespondSwapDto, 
  ApproveSwapDto 
} from '../../types/swap-request.types';

export const swapRequestsService = {
  async getSwapRequests(params?: {
    status?: string;
    type?: string;
    locationId?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/swap-requests', { params });
    return response.data;
  },

  async getSwapRequestById(id: string): Promise<{ data: SwapRequest }> {
    const response = await apiClient.get(`/swap-requests/${id}`);
    return response.data;
  },

  async getAvailableDrops(params?: { locationId?: string; skillId?: string }) {
    const response = await apiClient.get('/swap-requests/available-drops', { params });
    return response.data;
  },

  async createSwapRequest(data: CreateSwapRequestDto): Promise<{ data: SwapRequest }> {
    const response = await apiClient.post('/swap-requests', data);
    return response.data;
  },

  async respondToSwap(id: string, data: RespondSwapDto): Promise<{ data: SwapRequest }> {
    const response = await apiClient.post(`/swap-requests/${id}/respond`, data);
    return response.data;
  },

  async approveSwap(id: string, data: ApproveSwapDto): Promise<{ data: SwapRequest }> {
    const response = await apiClient.post(`/swap-requests/${id}/approve`, data);
    return response.data;
  },

  async cancelSwapRequest(id: string): Promise<void> {
    await apiClient.delete(`/swap-requests/${id}`);
  },

  // Picks up an available dropped shift by its swap request ID
  async pickupShift(swapRequestId: string): Promise<{ data: SwapRequest }> {
    const response = await apiClient.post(`/swap-requests/${swapRequestId}/pickup`);
    return response.data;
  },
};