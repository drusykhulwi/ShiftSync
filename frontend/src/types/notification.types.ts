export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  priority: number;
  createdAt: string;
}

export interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
  digest?: boolean;
  types?: Record<string, boolean>;
}