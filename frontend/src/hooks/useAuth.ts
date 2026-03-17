import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../services/api/auth.service';
import { LoginCredentials, RegisterData, User, AuthState } from '../types/auth.types';

export const useAuth = () => {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    try {
      const token = authService.getStoredToken();
      const user = authService.getStoredUser();

      if (token && user) {
        setState({
          user,
          token,
          isLoading: false,
          error: null,
        });
        authService.setAuthToken(token);
      } else {
        // Clear any corrupted data
        if (token && !user) {
          localStorage.removeItem('token');
        }
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error in auth initialization:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
  setState(prev => ({ ...prev, isLoading: true, error: null }));
  try {
    const response = await authService.login(credentials);
    console.log('Login response:', response); // Add this to debug
    
    const { accessToken, refreshToken, user } = response.data;
    
    authService.setAuthToken(accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    setState({
      user,
      token: accessToken,
      isLoading: false,
      error: null,
    });

    // Redirect based on role
    if (user.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (user.role === 'MANAGER') {
      router.push('/manager/dashboard');
    } else {
      router.push('/staff/dashboard');
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Login error:', error); // Add this to debug
    const message = error.response?.data?.error?.message || 'Login failed';
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: message,
    }));
    return { success: false, error: message };
  }
};

  const register = async (data: RegisterData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authService.register(data);
      const { accessToken, refreshToken, user } = response.data;
      
      authService.setAuthToken(accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setState({
        user,
        token: accessToken,
        isLoading: false,
        error: null,
      });

      router.push('/dashboard');
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Registration failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    await authService.logout();
    setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
    router.push('/login');
  };

  const isAuthenticated = !!state.token && !!state.user;

  return {
    ...state,
    login,
    register,
    logout,
    isAuthenticated,
  };
};