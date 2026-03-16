// backend/src/common/guards/roles.guard.ts
import { 
  Injectable, 
  CanActivate, 
  ExecutionContext,
  ForbiddenException 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../constants/roles.constants';
import { ERROR_CODES } from '../constants/error-codes.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required = public access
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'User not authenticated',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRole) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: `Required roles: ${requiredRoles.join(', ')}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return true;
  }
}