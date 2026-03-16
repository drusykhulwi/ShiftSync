// backend/src/common/guards/location-access.guard.ts
import { 
  Injectable, 
  CanActivate, 
  ExecutionContext,
  ForbiddenException,
  NotFoundException 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ERROR_CODES } from '../constants/error-codes.constants';
import { LOCATION_ACCESS_KEY, LocationAccessOptions } from '../decorators/location-access.decorator';

@Injectable()
export class LocationAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // If no user, let other guards handle it
    if (!user) {
      return true;
    }

    // Get location access options from decorator
    const locationOptions = this.reflector.getAllAndOverride<LocationAccessOptions>(
      LOCATION_ACCESS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no location decorator, skip this guard
    if (!locationOptions) {
      return true;
    }

    // Get locationId from params or body based on options
    let locationId: string | undefined;
    
    if (locationOptions.param) {
      locationId = request.params[locationOptions.param];
    } else if (locationOptions.body) {
      locationId = request.body[locationOptions.body];
    } else {
      // Default to 'locationId' param
      locationId = request.params.locationId || request.body.locationId;
    }

    // If location is required but not provided
    if (locationOptions.required !== false && !locationId) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Location ID is required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // If no locationId, skip (for optional location access)
    if (!locationId) {
      return true;
    }

    // Admin can access all locations
    if (user.role === 'ADMIN') {
      return true;
    }

    // Check if location exists
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Location not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Managers can only access their locations
    if (user.role === 'MANAGER') {
      const hasAccess = await this.prisma.location.findFirst({
        where: {
          id: locationId,
          managers: {
            some: { id: user.id }
          }
        }
      });

      if (!hasAccess) {
        throw new ForbiddenException({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'You do not have access to this location',
          },
          timestamp: new Date().toISOString(),
        });
      }
      return true;
    }

    // Staff can only access locations they're certified at
    if (user.role === 'STAFF') {
      const hasAccess = await this.prisma.certification.findFirst({
        where: {
          userId: user.id,
          locationId: locationId,
        }
      });

      if (!hasAccess) {
        throw new ForbiddenException({
          success: false,
          error: {
            code: ERROR_CODES.LOCATION_MISMATCH,
            message: 'You are not certified at this location',
          },
          timestamp: new Date().toISOString(),
        });
      }
      return true;
    }

    return false;
  }
}