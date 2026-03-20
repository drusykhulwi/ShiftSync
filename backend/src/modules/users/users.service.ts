// backend/src/modules/users/users.service.ts
import { 
  Injectable, NotFoundException, ConflictException, ForbiddenException 
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ERROR_CODES } from '../../common/constants/error-codes.constants';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, actorRole: string, actorId?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException({
        success: false,
        error: { code: ERROR_CODES.USER_ALREADY_EXISTS, message: 'User with this email already exists' },
        timestamp: new Date().toISOString(),
      });
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        phone: createUserDto.phone,
        role: createUserDto.role,
        desiredHours: createUserDto.desiredHours,
        notificationPrefs: { inApp: true, email: false, push: false },
      },
    });

    if (createUserDto.role === 'MANAGER' && createUserDto.locationIds?.length) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { managedLocations: { connect: createUserDto.locationIds.map(id => ({ id })) } },
      });
    }

    return this.findOne(user.id);
  }

  async findAll(role?: string, locationId?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (role) where.role = role;
    if (locationId) where.certifications = { some: { locationId } };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip, take: limit,
        include: {
          managedLocations: true,
          certifications: { include: { location: true, skill: true } },
          availabilities: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(user => new UserResponseDto(user)),
      meta: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        managedLocations: true,
        certifications: { include: { location: true, skill: true } },
        availabilities: true,
      },
    });
    if (!user) {
      throw new NotFoundException({
        success: false,
        error: { code: ERROR_CODES.USER_NOT_FOUND, message: 'User not found' },
        timestamp: new Date().toISOString(),
      });
    }
    return new UserResponseDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto, actorRole: string, actorId?: string) {
    await this.findOne(id);
    if (updateUserDto.role && actorRole !== 'ADMIN') {
      throw new ForbiddenException({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Only admins can update user roles' },
        timestamp: new Date().toISOString(),
      });
    }
    const updatedUser = await this.prisma.user.update({
      where: { id }, data: updateUserDto,
      include: {
        managedLocations: true,
        certifications: { include: { location: true, skill: true } },
      },
    });
    return new UserResponseDto(updatedUser);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    await this.findOne(userId);
    const updatedUser = await this.prisma.user.update({ where: { id: userId }, data: updateProfileDto });
    return new UserResponseDto(updatedUser);
  }

  async remove(id: string, actorRole: string) {
    if (actorRole !== 'ADMIN') {
      throw new ForbiddenException({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Only admins can delete users' },
        timestamp: new Date().toISOString(),
      });
    }
    await this.findOne(id);
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return { success: true, message: 'User deactivated successfully', timestamp: new Date().toISOString() };
  }

  async getStaffByLocation(locationId: string) {
    const users = await this.prisma.user.findMany({
      where: { role: 'STAFF', certifications: { some: { locationId } } },
      include: {
        certifications: { where: { locationId }, include: { skill: true } },
        availabilities: true,
      },
    });
    return users.map(user => new UserResponseDto(user));
  }

  async addCertification(userId: string, skillId: string, locationId: string, certifiedBy: string) {
    const certification = await this.prisma.certification.create({
      data: { userId, skillId, locationId, certifiedBy },
      include: { skill: true, location: true },
    });
    return certification;
  }

  async removeCertification(userId: string, certificationId: string) {
    await this.prisma.certification.delete({ where: { id: certificationId } });
    return { success: true, message: 'Certification removed' };
  }

  // ── Availability methods ────────────────────────────────────────────────

  async getAvailability(userId: string) {
    const availabilities = await this.prisma.availability.findMany({
      where: { userId },
      orderBy: [{ isRecurring: 'desc' }, { dayOfWeek: 'asc' }, { exceptionDate: 'asc' }],
    });
    return { success: true, data: availabilities, timestamp: new Date().toISOString() };
  }

  async setAvailability(userId: string, availability: any[]) {
    await this.findOne(userId);
    await this.prisma.$transaction(async (prisma) => {
      // Only replace recurring — leave exceptions intact
      await prisma.availability.deleteMany({ where: { userId, isRecurring: true } });
      if (availability.length > 0) {
        await prisma.availability.createMany({
          data: availability.map((a) => ({
            userId,
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
            isAvailable: a.isAvailable ?? true,
            isRecurring: true,
          })),
        });
      }
    });
    return this.getAvailability(userId);
  }

  async addException(userId: string, data: any) {
    await this.findOne(userId);
    const availability = await this.prisma.availability.create({
      data: {
        userId,
        exceptionDate: new Date(data.exceptionDate),
        startTime: data.startTime || '09:00',
        endTime: data.endTime || '17:00',
        isAvailable: data.isAvailable ?? true,
        isRecurring: false,
        dayOfWeek: new Date(data.exceptionDate).getDay(),
      },
    });
    return { success: true, data: availability, timestamp: new Date().toISOString() };
  }

  async deleteAvailability(userId: string, availabilityId: string) {
    const availability = await this.prisma.availability.findUnique({
      where: { id: availabilityId },
    });
    if (!availability || availability.userId !== userId) {
      throw new NotFoundException('Availability record not found');
    }
    await this.prisma.availability.delete({ where: { id: availabilityId } });
    return { success: true, message: 'Availability removed', timestamp: new Date().toISOString() };
  }
}