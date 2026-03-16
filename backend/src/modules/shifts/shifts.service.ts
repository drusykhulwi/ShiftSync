// backend/src/modules/shifts/shifts.service.ts
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ShiftConstraintsValidator } from './validators/shift-constraints.validator';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { AssignStaffDto } from './dto/assign-staff.dto';
import { PublishScheduleDto } from './dto/publish-schedule.dto';
import { ShiftResponseDto } from './dto/shift-response.dto';
import { ERROR_CODES } from '../../common/constants/error-codes.constants';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from '../audit/audit.service';
import { ShiftStatus } from '@prisma/client';
import { differenceInHours, isBefore, addHours } from 'date-fns';

@Injectable()
export class ShiftsService {
  constructor(
    private prisma: PrismaService,
    private validator: ShiftConstraintsValidator,
    private notificationService: NotificationService,
    private auditService: AuditService,
  ) {}

  // ========== SHIFT CREATION ==========

  async create(createShiftDto: CreateShiftDto, userId: string) {
    // Validate location exists
    const location = await this.prisma.location.findUnique({
      where: { id: createShiftDto.locationId },
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

    // Validate end time after start time
    if (createShiftDto.endTime <= createShiftDto.startTime) {
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'End time must be after start time',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Create shift with requirements in a transaction
    const shift = await this.prisma.$transaction(async (prisma) => {
      // Create the shift
      const newShift = await prisma.shift.create({
        data: {
          locationId: createShiftDto.locationId,
          title: createShiftDto.title,
          description: createShiftDto.description,
          startTime: createShiftDto.startTime,
          endTime: createShiftDto.endTime,
          status: createShiftDto.status || ShiftStatus.DRAFT,
          cutoffHours: createShiftDto.cutoffHours || 48,
          createdById: userId,
        },
      });

      // Create requirements
      if (createShiftDto.requirements?.length) {
        await prisma.shiftRequirement.createMany({
          data: createShiftDto.requirements.map(req => ({
            shiftId: newShift.id,
            skillId: req.skillId,
            headcount: req.headcount,
            priority: req.priority || 0,
          })),
        });
      }

      return newShift;
    });

    // Fetch complete shift with relations
    const completeShift = await this.findOne(shift.id);

    // Log audit
    await this.auditService.log({
      actorId: userId,
      action: 'CREATE',
      entityType: 'Shift',
      entityId: shift.id,
      afterState: completeShift,
    });

    return completeShift;
  }

  // ========== FIND SHIFTS ==========

  async findAll(
    locationId?: string,
    status?: ShiftStatus,
    startDate?: Date,
    endDate?: Date,
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit;
    
    const where: any = {};

    if (locationId) where.locationId = locationId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    const [shifts, total] = await Promise.all([
      this.prisma.shift.findMany({
        where,
        skip,
        take: limit,
        include: {
          location: {
            select: {
              id: true,
              name: true,
              timezone: true,
            },
          },
          requirements: {
            include: {
              skill: true,
              assignments: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              assignments: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.shift.count({ where }),
    ]);

    const transformedShifts = shifts.map(shift => {
      const dto = new ShiftResponseDto(shift);
      
      // Calculate assigned count per requirement
      dto.requirements = shift.requirements.map(req => ({
        ...req,
        assignedCount: req.assignments.length,
      }));
      
      dto.assignedCount = shift._count.assignments;
      dto.openSpots = shift.requirements.reduce(
        (sum, req) => sum + (req.headcount - req.assignments.length), 
        0
      );
      
      return dto;
    });

    return {
      data: transformedShifts,
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
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            timezone: true,
          },
        },
        requirements: {
          include: {
            skill: true,
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.SHIFT_NOT_FOUND,
          message: 'Shift not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const dto = new ShiftResponseDto(shift);
    
    // Calculate assigned count per requirement
    dto.requirements = shift.requirements.map(req => ({
      ...req,
      assignedCount: req.assignments.length,
    }));
    
    dto.assignedCount = shift._count.assignments;
    dto.openSpots = shift.requirements.reduce(
      (sum, req) => sum + (req.headcount - req.assignments.length), 
      0
    );

    return dto;
  }

  async findByLocation(locationId: string, startDate?: Date, endDate?: Date) {
    const where: any = { locationId };
    
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    const shifts = await this.prisma.shift.findMany({
      where,
      include: {
        requirements: {
          include: {
            skill: true,
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return shifts.map(shift => new ShiftResponseDto(shift));
  }

  // ========== UPDATE SHIFTS ==========

  async update(id: string, updateShiftDto: UpdateShiftDto, userId: string) {
    const shift = await this.findOne(id);

    // Check if shift can be modified
    if (shift.status === ShiftStatus.PUBLISHED) {
      const cutoffTime = new Date(shift.startTime.getTime() - shift.cutoffHours * 60 * 60 * 1000);
      if (isBefore(new Date(), cutoffTime)) {
        throw new ForbiddenException({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Cannot modify published shifts within cutoff period',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (shift.status === ShiftStatus.COMPLETED) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Cannot modify completed shifts',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Update shift and requirements in transaction
    const updatedShift = await this.prisma.$transaction(async (prisma) => {
      // Update shift
      const updated = await prisma.shift.update({
        where: { id },
        data: {
          title: updateShiftDto.title,
          description: updateShiftDto.description,
          startTime: updateShiftDto.startTime,
          endTime: updateShiftDto.endTime,
          status: updateShiftDto.status,
          cutoffHours: updateShiftDto.cutoffHours,
        },
      });

      // Update requirements if provided
      if (updateShiftDto.requirements) {
        // Delete existing requirements
        await prisma.shiftRequirement.deleteMany({
          where: { shiftId: id },
        });

        // Create new requirements
        if (updateShiftDto.requirements.length > 0) {
          await prisma.shiftRequirement.createMany({
            data: updateShiftDto.requirements.map(req => ({
              shiftId: id,
              skillId: req.skillId!,
              headcount: req.headcount!,
              priority: req.priority || 0,
            })),
          });
        }
      }

      return updated;
    });

    const completeShift = await this.findOne(id);

    // Log audit
    await this.auditService.log({
      actorId: userId,
      action: 'UPDATE',
      entityType: 'Shift',
      entityId: id,
      beforeState: shift,
      afterState: completeShift,
    });

    // Notify assigned staff if shift changed
    if (shift.assignments?.length) {
      for (const assignment of shift.assignments) {
        await this.notificationService.create({
          userId: assignment.user.id,
          type: 'SHIFT_CHANGED',
          title: 'Shift Updated',
          message: `Shift "${shift.title}" on ${shift.startTime} has been updated`,
          data: { shiftId: id },
        });
      }
    }

    return completeShift;
  }

  // ========== ASSIGN STAFF ==========

  async assignStaff(shiftId: string, assignStaffDto: AssignStaffDto, userId: string) {
    const shift = await this.findOne(shiftId);

    // Check if shift can be modified
    if (shift.status === ShiftStatus.PUBLISHED) {
      const cutoffTime = new Date(shift.startTime.getTime() - shift.cutoffHours * 60 * 60 * 1000);
      if (isBefore(new Date(), cutoffTime)) {
        throw new ForbiddenException({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Cannot modify published shifts within cutoff period',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Validate assignment constraints
    const validation = await this.validator.validateAssignment(
      shiftId,
      assignStaffDto.userId,
      assignStaffDto.requirementId
    );

    if (!validation.valid) {
      // Find alternatives
      const alternatives = await this.validator.findAlternatives(
        shiftId,
        assignStaffDto.requirementId,
        assignStaffDto.userId
      );

      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.SHIFT_CONFLICT,
          message: 'Cannot assign staff due to constraint violations',
          details: {
            violations: validation.errors || validation.violations,
            alternatives,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Create assignment
    const assignment = await this.prisma.shiftAssignment.create({
      data: {
        shiftId,
        userId: assignStaffDto.userId,
        requirementId: assignStaffDto.requirementId,
        isPrimary: assignStaffDto.isPrimary ?? true,
      },
      include: {
        user: true,
        shift: true,
      },
    });

    // Log audit
    await this.auditService.log({
      actorId: userId,
      action: 'ASSIGN',
      entityType: 'ShiftAssignment',
      entityId: assignment.id,
      afterState: assignment,
    });

    // Send notification to assigned staff
    await this.notificationService.create({
      userId: assignStaffDto.userId,
      type: 'SHIFT_ASSIGNED',
      title: 'New Shift Assignment',
      message: `You've been assigned to "${shift.title}" on ${shift.startTime}`,
      data: { shiftId, assignmentId: assignment.id },
    });

    // Create overtime warning if needed
    if (validation.warnings?.length) {
      for (const warning of validation.warnings) {
        await this.prisma.overtimeWarning.create({
          data: {
            userId: assignStaffDto.userId,
            weekStart: this.validator['getWeekStart'](shift.startTime),
            totalHours: 0, // Will be calculated later
            warningType: warning.type,
            details: warning,
          },
        });
      }
    }

    return assignment;
  }

  async unassignStaff(shiftId: string, assignmentId: string, userId: string) {
    const assignment = await this.prisma.shiftAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        user: true,
        shift: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Assignment not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if shift can be modified
    if (assignment.shift.status === ShiftStatus.PUBLISHED) {
      const cutoffTime = new Date(
        assignment.shift.startTime.getTime() - assignment.shift.cutoffHours * 60 * 60 * 1000
      );
      if (isBefore(new Date(), cutoffTime)) {
        throw new ForbiddenException({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Cannot modify published shifts within cutoff period',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    await this.prisma.shiftAssignment.delete({
      where: { id: assignmentId },
    });

    // Log audit
    await this.auditService.log({
      actorId: userId,
      action: 'UNSIGN',
      entityType: 'ShiftAssignment',
      entityId: assignmentId,
      beforeState: assignment,
    });

    // Send notification
    await this.notificationService.create({
      userId: assignment.userId,
      type: 'SHIFT_CHANGED',
      title: 'Shift Assignment Removed',
      message: `Your assignment to "${assignment.shift.title}" has been removed`,
      data: { shiftId },
    });

    return {
      success: true,
      message: 'Staff unassigned successfully',
      timestamp: new Date().toISOString(),
    };
  }

  // ========== PUBLISH SCHEDULE ==========

  async publishShifts(publishScheduleDto: PublishScheduleDto, userId: string) {
    const { shiftIds, message, publishDate } = publishScheduleDto;

    const shifts = await this.prisma.shift.findMany({
      where: { id: { in: shiftIds } },
      include: {
        assignments: {
          include: { user: true },
        },
      },
    });

    if (shifts.length !== shiftIds.length) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.SHIFT_NOT_FOUND,
          message: 'One or more shifts not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if any shifts are already published or completed
    const invalidShifts = shifts.filter(
      s => s.status === ShiftStatus.PUBLISHED || s.status === ShiftStatus.COMPLETED
    );

    if (invalidShifts.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: `Cannot publish shifts that are already ${invalidShifts[0].status}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Update all shifts to published
    const updatedShifts = await this.prisma.$transaction(
      shifts.map(shift =>
        this.prisma.shift.update({
          where: { id: shift.id },
          data: {
            status: ShiftStatus.PUBLISHED,
            publishedAt: publishDate || new Date(),
            publishedBy: userId,
          },
        })
      )
    );

    // Log audit
    await this.auditService.log({
      actorId: userId,
      action: 'PUBLISH',
      entityType: 'Shift',
      entityId: shiftIds.join(','),
      afterState: { shiftIds, count: shifts.length },
    });

    // Notify all assigned staff
    const notifiedUsers = new Set();
    for (const shift of shifts) {
      for (const assignment of shift.assignments) {
        if (!notifiedUsers.has(assignment.userId)) {
          notifiedUsers.add(assignment.userId);
          await this.notificationService.create({
            userId: assignment.userId,
            type: 'SCHEDULE_PUBLISHED',
            title: 'Schedule Published',
            message: message || 'Your schedule has been published',
            data: { shiftIds },
          });
        }
      }
    }

    return {
      success: true,
      message: `Published ${shifts.length} shifts successfully`,
      data: updatedShifts.map(s => new ShiftResponseDto(s)),
      timestamp: new Date().toISOString(),
    };
  }

  // ========== DELETE SHIFT ==========

  async remove(id: string, userId: string) {
    const shift = await this.findOne(id);

    if (shift.status === ShiftStatus.PUBLISHED) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Cannot delete published shifts. Unpublish first.',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (shift.status === ShiftStatus.COMPLETED) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Cannot delete completed shifts',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (shift.assignedCount > 0) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Cannot delete shift with assigned staff. Unassign first.',
        },
        timestamp: new Date().toISOString(),
      });
    }

    await this.prisma.shift.delete({
      where: { id },
    });

    // Log audit
    await this.auditService.log({
      actorId: userId,
      action: 'DELETE',
      entityType: 'Shift',
      entityId: id,
      beforeState: shift,
    });

    return {
      success: true,
      message: 'Shift deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  // ========== UTILITY METHODS ==========

  async getScheduleOverview(locationId: string, startDate: Date, endDate: Date) {
    const shifts = await this.prisma.shift.findMany({
      where: {
        locationId,
        startTime: { gte: startDate, lte: endDate },
      },
      include: {
        requirements: {
          include: {
            skill: true,
            assignments: true,
          },
        },
      },
    });

    const totalShifts = shifts.length;
    const totalSpots = shifts.reduce(
      (sum, s) => sum + s.requirements.reduce((rSum, r) => rSum + r.headcount, 0),
      0
    );
    const filledSpots = shifts.reduce(
      (sum, s) => sum + s.requirements.reduce((rSum, r) => rSum + r.assignments.length, 0),
      0
    );
    const openSpots = totalSpots - filledSpots;

    return {
      locationId,
      dateRange: { startDate, endDate },
      stats: {
        totalShifts,
        totalSpots,
        filledSpots,
        openSpots,
        fillRate: totalSpots > 0 ? (filledSpots / totalSpots) * 100 : 0,
      },
      shifts: shifts.map(s => new ShiftResponseDto(s)),
      timestamp: new Date().toISOString(),
    };
  }

  async checkConflicts(userId: string, startDate: Date, endDate: Date) {
    const assignments = await this.prisma.shiftAssignment.findMany({
      where: {
        userId,
        shift: {
          startTime: { gte: startDate, lte: endDate },
        },
      },
      include: {
        shift: {
          include: {
            location: true,
          },
        },
      },
      orderBy: {
        shift: { startTime: 'asc' },
      },
    });

    const conflicts = [];
    
    // Check for gaps less than 10 hours
    for (let i = 0; i < assignments.length - 1; i++) {
      const current = assignments[i].shift;
      const next = assignments[i + 1].shift;
      
      const gap = differenceInHours(next.startTime, current.endTime);
      
      if (gap < 10) {
        conflicts.push({
          type: 'INSUFFICIENT_REST',
          shift1: { id: current.id, start: current.startTime, end: current.endTime },
          shift2: { id: next.id, start: next.startTime, end: next.endTime },
          gap,
          message: `Only ${gap} hours between shifts (minimum 10 required)`,
        });
      }
    }

    // Check for daily overtime
    const dailyHours: Record<string, number> = {};
    for (const assignment of assignments) {
      const dateKey = assignment.shift.startTime.toDateString();
      const hours = differenceInHours(assignment.shift.endTime, assignment.shift.startTime);
      dailyHours[dateKey] = (dailyHours[dateKey] || 0) + hours;
      
      if (dailyHours[dateKey] > 12) {
        conflicts.push({
          type: 'DAILY_OVERTIME',
          date: dateKey,
          totalHours: dailyHours[dateKey],
          message: `Exceeds 12 hours on ${dateKey}`,
        });
      }
    }

    return {
      userId,
      dateRange: { startDate, endDate },
      totalShifts: assignments.length,
      conflicts,
      hasConflicts: conflicts.length > 0,
      timestamp: new Date().toISOString(),
    };
  }
}