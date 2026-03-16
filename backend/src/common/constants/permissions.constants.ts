// backend/src/common/constants/permissions.constants.ts
export const PERMISSIONS = {
  // User permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Shift permissions
  SHIFT_CREATE: 'shift:create',
  SHIFT_READ: 'shift:read',
  SHIFT_UPDATE: 'shift:update',
  SHIFT_DELETE: 'shift:delete',
  SHIFT_ASSIGN: 'shift:assign',
  SHIFT_PUBLISH: 'shift:publish',
  
  // Swap permissions
  SWAP_REQUEST: 'swap:request',
  SWAP_APPROVE: 'swap:approve',
  SWAP_CANCEL: 'swap:cancel',
  
  // Location permissions
  LOCATION_READ: 'location:read',
  LOCATION_MANAGE: 'location:manage',
  
  // Certification permissions
  CERTIFICATION_GRANT: 'certification:grant',
  CERTIFICATION_REVOKE: 'certification:revoke',
  
  // Report permissions
  REPORT_READ: 'report:read',
  REPORT_EXPORT: 'report:export',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS),
  MANAGER: [
    PERMISSIONS.SHIFT_CREATE,
    PERMISSIONS.SHIFT_READ,
    PERMISSIONS.SHIFT_UPDATE,
    PERMISSIONS.SHIFT_DELETE,
    PERMISSIONS.SHIFT_ASSIGN,
    PERMISSIONS.SHIFT_PUBLISH,
    PERMISSIONS.SWAP_APPROVE,
    PERMISSIONS.LOCATION_READ,
    PERMISSIONS.CERTIFICATION_GRANT,
    PERMISSIONS.REPORT_READ,
  ],
  STAFF: [
    PERMISSIONS.SHIFT_READ,
    PERMISSIONS.SWAP_REQUEST,
    PERMISSIONS.SWAP_CANCEL,
  ],
};