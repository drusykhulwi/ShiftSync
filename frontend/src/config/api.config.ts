export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000',
  TIMEOUT: 30000,
};