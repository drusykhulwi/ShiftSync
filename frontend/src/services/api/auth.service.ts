// frontend/src/services/api/auth.service.ts
import axios from 'axios';
import { API_CONFIG } from '../../config/api.config';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../../types/auth.types';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL, // This should be 'http://localhost:4000'
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Add this for cookies if needed
});


export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  setAuthToken(token: string) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  },

  getStoredToken(): string | null {
    return localStorage.getItem('token');
  },

  // Update the getStoredUser method
  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr || userStr === 'undefined' || userStr === 'null') {
        return null;
      }
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Failed to parse stored user:', error);
      // Clear the corrupted data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return null;
    }
  }
};