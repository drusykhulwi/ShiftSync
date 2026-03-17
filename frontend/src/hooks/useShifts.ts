import { useState, useEffect } from 'react';
import { shiftsService } from '../services/api/shifts.service';
import { Shift, CreateShiftDto } from '../types/shift.types';

export const useShifts = (locationId?: string) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = async (params?: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await shiftsService.getShifts({ locationId, ...params });
      setShifts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch shifts');
    } finally {
      setIsLoading(false);
    }
  };

  const createShift = async (data: CreateShiftDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await shiftsService.createShift(data);
      setShifts(prev => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create shift');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateShift = async (id: string, data: Partial<CreateShiftDto>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await shiftsService.updateShift(id, data);
      setShifts(prev => prev.map(s => s.id === id ? response.data : s));
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update shift');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteShift = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await shiftsService.deleteShift(id);
      setShifts(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete shift');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (locationId) {
      fetchShifts();
    }
  }, [locationId]);

  return {
    shifts,
    isLoading,
    error,
    fetchShifts,
    createShift,
    updateShift,
    deleteShift,
  };
};