// backend/src/modules/auth/interfaces/jwt-payload.interface.ts
export interface JwtPayload {
  sub: string;        // user id
  email: string;
  role: string;
  locations?: string[]; // location IDs user has access to
  iat?: number;
  exp?: number;
}