// backend/src/modules/locations/locations.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationResponseDto } from './dto/location-response.dto';
import { ERROR_CODES } from '../../common/constants/error-codes.constants';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async create(createLocationDto: CreateLocationDto, userId: string) {
    // Check if location with same name exists
    const existingLocation = await this.prisma.location.findFirst({
      where: { 
        name: createLocationDto.name,
        city: createLocationDto.city,
      },
    });

    if (existingLocation) {
      throw new ConflictException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Location with this name already exists in this city',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const location = await this.prisma.location.create({
      data: createLocationDto,
    });

    // Log audit - stringify the location
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'CREATE',
        entityType: 'Location',
        entityId: location.id,
        afterState: JSON.parse(JSON.stringify(location)), // Convert to plain object
      },
    });

    return new LocationResponseDto(location);
  }

  async findAll(page = 1, limit = 10, includeInactive = false) {
    const skip = (page - 1) * limit;
    
    const where = includeInactive ? {} : { isActive: true };

    const [locations, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              managers: true,
              certifications: true,
              shifts: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.location.count({ where }),
    ]);

    const transformedLocations = locations.map(location => {
      const dto = new LocationResponseDto(location);
      dto.managerCount = location._count.managers;
      dto.staffCount = location._count.certifications;
      dto.shiftCount = location._count.shifts;
      return dto;
    });

    return {
      data: transformedLocations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: {
        managers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        certifications: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            skill: true,
          },
        },
        shifts: {
          where: {
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: 'asc' },
          take: 10,
        },
        _count: {
          select: {
            managers: true,
            certifications: true,
            shifts: true,
          },
        },
      },
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

    const dto = new LocationResponseDto(location);
    dto.managerCount = location._count.managers;
    dto.staffCount = location._count.certifications;
    dto.shiftCount = location._count.shifts;

    return {
      ...dto,
      managers: location.managers,
      staff: location.certifications.map(c => ({
        id: c.user.id,
        name: `${c.user.firstName} ${c.user.lastName}`,
        email: c.user.email,
        skill: c.skill.name,
      })),
      upcomingShifts: location.shifts,
    };
  }

  async update(id: string, updateLocationDto: UpdateLocationDto, userId: string) {
    await this.findOne(id);

    const updatedLocation = await this.prisma.location.update({
      where: { id },
      data: updateLocationDto,
    });

    // Log audit - stringify the location
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'UPDATE',
        entityType: 'Location',
        entityId: id,
        afterState: JSON.parse(JSON.stringify(updatedLocation)),
      },
    });

    return new LocationResponseDto(updatedLocation);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);

    // Check if location has active shifts
    const activeShifts = await this.prisma.shift.count({
      where: {
        locationId: id,
        startTime: { gte: new Date() },
        status: { in: ['DRAFT', 'PUBLISHED'] },
      },
    });

    if (activeShifts > 0) {
      throw new ConflictException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Cannot delete location with active shifts. Deactivate it instead.',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Soft delete - just deactivate
    const location = await this.prisma.location.update({
      where: { id },
      data: { isActive: false },
    });

    // Log audit - stringify the location
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'DELETE',
        entityType: 'Location',
        entityId: id,
        afterState: JSON.parse(JSON.stringify(location)),
      },
    });

    return {
      success: true,
      message: 'Location deactivated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async assignManager(locationId: string, managerId: string, userId: string) {
    // Check if location exists
    await this.findOne(locationId);

    const manager = await this.prisma.user.findFirst({
      where: {
        id: managerId,
        role: 'MANAGER',
      },
    });

    if (!manager) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'Manager not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Update the location
    const updatedLocation = await this.prisma.location.update({
      where: { id: locationId },
      data: {
        managers: {
          connect: { id: managerId },
        },
      },
      include: { managers: true },
    });

    // Log audit - stringify the location
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'UPDATE',
        entityType: 'Location',
        entityId: locationId,
        afterState: JSON.parse(JSON.stringify(updatedLocation)),
      },
    });

    return {
      success: true,
      message: 'Manager assigned successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async removeManager(locationId: string, managerId: string, userId: string) {
    // Check if location exists
    await this.findOne(locationId);

    // Update the location
    const updatedLocation = await this.prisma.location.update({
      where: { id: locationId },
      data: {
        managers: {
          disconnect: { id: managerId },
        },
      },
      include: { managers: true },
    });

    // Log audit - stringify the location
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'UPDATE',
        entityType: 'Location',
        entityId: locationId,
        afterState: JSON.parse(JSON.stringify(updatedLocation)),
      },
    });

    return {
      success: true,
      message: 'Manager removed successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async getLocationStats(id: string) {
    const location = await this.findOne(id);

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    const [
      totalStaff,
      totalManagers,
      todayShifts,
      upcomingShifts,
      completedShifts,
    ] = await Promise.all([
      this.prisma.certification.count({ where: { locationId: id } }),
      this.prisma.user.count({ 
        where: { 
            role: 'MANAGER',
            managedLocations: { some: { id } } 
        } 
      }),
      this.prisma.shift.count({
        where: {
          locationId: id,
          startTime: { gte: startOfDay, lte: endOfDay },
        },
      }),
      this.prisma.shift.count({
        where: {
          locationId: id,
          startTime: { gt: endOfDay },
        },
      }),
      this.prisma.shift.count({
        where: {
          locationId: id,
          endTime: { lt: new Date() },
        },
      }),
    ]);

    return {
      locationId: id,
      locationName: location.name,
      stats: {
        totalStaff,
        totalManagers,
        todayShifts,
        upcomingShifts,
        completedShifts,
      },
      timestamp: new Date().toISOString(),
    };
  }
}