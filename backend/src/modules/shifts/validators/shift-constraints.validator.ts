// backend/src/modules/shifts/validators/shift-constraints.validator.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { differenceInHours, isBefore, addHours } from 'date-fns';

@Injectable()
export class ShiftConstraintsValidator {
  constructor(private prisma: PrismaService) {}

  async validateAssignment(shiftId: string, userId: string, requirementId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        location: true,
        requirements: {
          include: { skill: true }
        },
        assignments: {
          include: { user: true }
        }
      }
    });

    if (!shift) {
      return {
        valid: false,
        error: 'Shift not found'
      };
    }

    const requirement = shift.requirements.find(r => r.id === requirementId);
    if (!requirement) {
      return {
        valid: false,
        error: 'Requirement not found'
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        certifications: {
          include: {
            location: true,
            skill: true
          }
        },
        availabilities: true,
        assignedShifts: {
          include: { shift: true }
        }
      }
    });

    if (!user) {
      return {
        valid: false,
        error: 'User not found'
      };
    }

    const violations = [];

    // 1. Check location certification
    const locationCertified = user.certifications.some(
      c => c.locationId === shift.locationId && 
           c.skillId === requirement.skillId &&
           c.isActive
    );

    if (!locationCertified) {
      violations.push({
        type: 'CERTIFICATION',
        message: `User is not certified for ${requirement.skill.name} at ${shift.location.name}`
      });
    }

    // 2. Check availability
    const isAvailable = user.availabilities.some(avail => {
      if (avail.exceptionDate) {
        return avail.exceptionDate.toDateString() === shift.startTime.toDateString() &&
               avail.isAvailable;
      }
      if (avail.isRecurring) {
        const shiftDay = shift.startTime.getDay();
        const [startHour, startMin] = avail.startTime.split(':').map(Number);
        const [endHour, endMin] = avail.endTime.split(':').map(Number);
        
        const shiftStartHour = shift.startTime.getHours();
        const shiftStartMin = shift.startTime.getMinutes();
        const shiftEndHour = shift.endTime.getHours();
        const shiftEndMin = shift.endTime.getMinutes();
        
        return avail.dayOfWeek === shiftDay &&
               (shiftStartHour > startHour || (shiftStartHour === startHour && shiftStartMin >= startMin)) &&
               (shiftEndHour < endHour || (shiftEndHour === endHour && shiftEndMin <= endMin));
      }
      return false;
    });

    if (!isAvailable) {
      violations.push({
        type: 'AVAILABILITY',
        message: 'User is not available during this shift'
      });
    }

    // 3. Check double-booking
    const overlappingShift = shift.assignments.find(a => 
      a.userId === userId
    );

    if (overlappingShift) {
      violations.push({
        type: 'DOUBLE_BOOKING',
        message: 'User is already assigned to this shift'
      });
    }

    const otherShifts = await this.prisma.shiftAssignment.findFirst({
      where: {
        userId,
        shift: {
          startTime: { lt: shift.endTime },
          endTime: { gt: shift.startTime },
          id: { not: shiftId }
        }
      }
    });

    if (otherShifts) {
      violations.push({
        type: 'OVERLAPPING_SHIFT',
        message: 'User has another shift during this time'
      });
    }

    // 4. Check 10-hour gap
    const previousShift = await this.prisma.shiftAssignment.findFirst({
      where: {
        userId,
        shift: {
          endTime: { lte: shift.startTime }
        }
      },
      orderBy: {
        shift: { endTime: 'desc' }
      },
      include: { shift: true }
    });

    if (previousShift) {
      const hoursBetween = differenceInHours(
        shift.startTime,
        previousShift.shift.endTime
      );
      
      if (hoursBetween < 10) {
        violations.push({
          type: 'REST_PERIOD',
          message: `Must have at least 10 hours between shifts (currently ${hoursBetween} hours)`
        });
      }
    }

    // 5. Check weekly hours
    const weekStart = this.getWeekStart(shift.startTime);
    const weekEnd = addHours(weekStart, 168); // 7 days

    const weekShifts = await this.prisma.shiftAssignment.findMany({
      where: {
        userId,
        shift: {
          startTime: { gte: weekStart, lt: weekEnd }
        }
      },
      include: { shift: true }
    });

    const currentShiftHours = differenceInHours(shift.endTime, shift.startTime);
    const totalHours = weekShifts.reduce((sum, a) => 
      sum + differenceInHours(a.shift.endTime, a.shift.startTime), 0
    ) + currentShiftHours;

    if (totalHours > 40) {
      violations.push({
        type: 'WEEKLY_OVERTIME',
        message: `This would exceed 40 hours (${totalHours.toFixed(1)} total)`
      });
    } else if (totalHours > 35) {
      violations.push({
        type: 'OVERTIME_WARNING',
        message: `Approaching overtime: ${totalHours.toFixed(1)} hours`
      });
    }

    // 6. Check consecutive days
    const sevenDaysAgo = new Date(shift.startTime);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentShifts = await this.prisma.shiftAssignment.findMany({
      where: {
        userId,
        shift: {
          startTime: { gte: sevenDaysAgo }
        }
      },
      include: { shift: true },
      orderBy: {
        shift: { startTime: 'asc' }
      }
    });

    const consecutiveDays = this.calculateConsecutiveDays(recentShifts, shift);
    
    if (consecutiveDays === 7) {
      violations.push({
        type: 'MAX_CONSECUTIVE_DAYS',
        message: 'Cannot work 7 consecutive days'
      });
    } else if (consecutiveDays === 6) {
      violations.push({
        type: 'CONSECUTIVE_DAY_WARNING',
        message: 'This would be the 6th consecutive day'
      });
    }

    // 7. Check daily hours
    const sameDayShifts = weekShifts.filter(a => 
      a.shift.startTime.toDateString() === shift.startTime.toDateString()
    );
    
    const dailyHours = sameDayShifts.reduce((sum, a) => 
      sum + differenceInHours(a.shift.endTime, a.shift.startTime), 0
    ) + currentShiftHours;

    if (dailyHours > 12) {
      violations.push({
        type: 'MAX_DAILY_HOURS',
        message: `Cannot exceed 12 hours in a single day (${dailyHours.toFixed(1)} hours)`
      });
    }

    return {
      valid: violations.length === 0,
      violations,
      warnings: violations.filter(v => v.type.includes('WARNING')),
      errors: violations.filter(v => !v.type.includes('WARNING'))
    };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private calculateConsecutiveDays(shifts: any[], newShift: any): number {
    if (shifts.length === 0) return 1;
    
    let consecutive = 1;
    let currentDate = new Date(newShift.shift.startTime);
    currentDate.setHours(0, 0, 0, 0);
    
    const sortedShifts = [...shifts].sort((a, b) => 
      b.shift.startTime - a.shift.startTime
    );
    
    for (const shift of sortedShifts) {
      const shiftDate = new Date(shift.shift.startTime);
      shiftDate.setHours(0, 0, 0, 0);
      
      const dayDiff = Math.floor(
        (currentDate.getTime() - shiftDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (dayDiff === 1) {
        consecutive++;
        currentDate = shiftDate;
      } else if (dayDiff > 1) {
        break;
      }
    }
    
    return consecutive;
  }

  async findAlternatives(shiftId: string, requirementId: string, excludeUserId?: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        location: true,
        requirements: {
          where: { id: requirementId },
          include: { skill: true }
        }
      }
    });

    if (!shift || !shift.requirements[0]) return [];

    const requirement = shift.requirements[0];

    // Find qualified users
    const qualifiedUsers = await this.prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        role: 'STAFF',
        isActive: true,
        certifications: {
          some: {
            locationId: shift.locationId,
            skillId: requirement.skillId,
            isActive: true
          }
        }
      },
      include: {
        availabilities: true,
        certifications: {
          where: {
            locationId: shift.locationId,
            skillId: requirement.skillId
          }
        }
      }
    });

    // Filter by availability
    const availableUsers = qualifiedUsers.filter(user => {
      return user.availabilities.some(avail => {
        if (avail.exceptionDate) {
          return avail.exceptionDate.toDateString() === shift.startTime.toDateString() &&
                 avail.isAvailable;
        }
        if (avail.isRecurring) {
          const shiftDay = shift.startTime.getDay();
          const [startHour, startMin] = avail.startTime.split(':').map(Number);
          const [endHour, endMin] = avail.endTime.split(':').map(Number);
          
          return avail.dayOfWeek === shiftDay &&
                 shift.startTime.getHours() >= startHour &&
                 shift.endTime.getHours() <= endHour;
        }
        return false;
      });
    });

    return availableUsers.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      reason: 'Has required certification and availability'
    }));
  }
}