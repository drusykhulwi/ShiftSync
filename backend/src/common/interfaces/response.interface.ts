// backend/src/common/interfaces/response.interface.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
    details?: any;
  };
  timestamp: string;
  path?: string;
}