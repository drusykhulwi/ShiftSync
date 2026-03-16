// backend/src/common/constants/roles.constants.ts
export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];