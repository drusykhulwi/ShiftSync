// backend/src/modules/overtime/overtime.service.ts
import { 
  Injectable, 
  Logger, 
  NotFoundException,
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { 
  CreateOvertimeWarningDto, 
  OvertimeWarningResponseDto,
  WarningType 
} from './dto/overtime-warning.dto';
import { 
  OvertimeReportDto, 
  OvertimeReportResponseDto,
  OvertimeSummaryDto,
  ReportPeriod 
} from './dto/overtime-report.dto';
import { 
  FairnessReportDto, 
  FairnessReportResponseDto,
  StaffHoursDto 
} from './dto/fairness-report.dto';
import { ERROR_CODES } from '../../common/constants/error-codes.constants';
import { differenceInHours, startOfWeek, endOfWeek } from 'date-fns';

@Injectable()
export class OvertimeService {
  private readonly logger = new Logger(OvertimeService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  // ========== WARNING MANAGEMENT ==========

  async createWarning(createDto: CreateOvertimeWarningDto) {
    // Check if warning already exists for this user/week/type
    const existingWarning = await this.prisma.overtimeWarning.findFirst({
      where: {
        userId: createDto.userId,
        weekStart: createDto.weekStart,
        warningType: createDto.warningType,
        acknowledgedAt: null,
      },
    });

    if (existingWarning) {
      return new OvertimeWarningResponseDto(existingWarning);
    }

    const warning = await this.prisma.overtimeWarning.create({
      data: {
        userId: createDto.userId,
        weekStart: createDto.weekStart,
        totalHours: createDto.totalHours,
        warningType: createDto.warningType,
        details: createDto.details || {},
      },
    });

    // Send notification
    await this.notificationsService.create({
      userId: createDto.userId,
      type: 'OVERTIME_WARNING',
      title: this.getWarningTitle(createDto.warningType),
      message: this.getWarningMessage(createDto),
      data: { warningId: warning.id, ...createDto.details },
    });

    // Notify managers if needed
    if (createDto.warningType === 'WEEKLY_HOURS' && createDto.totalHours >= 40) {
      await this.notifyManagers(createDto.userId, warning);
    }

    return new OvertimeWarningResponseDto(warning);
  }

  async getWarnings(
    userId?: string,
    locationId?: string,
    acknowledged = false,
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (!acknowledged) where.acknowledgedAt = null;

    if (locationId) {
      where.user = {
        certifications: {
          some: { locationId }
        }
      };
    }

    const [warnings, total] = await Promise.all([
      this.prisma.overtimeWarning.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.overtimeWarning.count({ where }),
    ]);

    return {
      data: warnings.map(w => new OvertimeWarningResponseDto(w)),
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

  async acknowledgeWarning(warningId: string, userId: string, notes?: string) {
    const warning = await this.prisma.overtimeWarning.findUnique({
      where: { id: warningId },
    });

    if (!warning) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Warning not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const acknowledged = await this.prisma.overtimeWarning.update({
      where: { id: warningId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
        details: {
          ...(warning.details as any),
          acknowledgmentNotes: notes,
        },
      },
    });

    return new OvertimeWarningResponseDto(acknowledged);
  }

  async resolveWarning(warningId: string, userId: string, resolution?: string) {
    const warning = await this.prisma.overtimeWarning.findUnique({
      where: { id: warningId },
    });

    if (!warning) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Warning not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const resolved = await this.prisma.overtimeWarning.update({
      where: { id: warningId },
      data: {
        resolvedAt: new Date(),
        resolvedBy: userId,
        details: {
          ...(warning.details as any),
          resolution,
        },
      },
    });

    return new OvertimeWarningResponseDto(resolved);
  }

  // ========== OVERTIME CALCULATION ==========

  async calculateWeeklyHours(userId: string, weekStart: Date): Promise<number> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const assignments = await this.prisma.shiftAssignment.findMany({
      where: {
        userId,
        shift: {
          startTime: { gte: weekStart, lt: weekEnd },
        },
      },
      include: { shift: true },
    });

    return assignments.reduce((total, a) => {
      const hours = differenceInHours(a.shift.endTime, a.shift.startTime);
      return total + hours;
    }, 0);
  }

  async calculateDailyHours(userId: string, date: Date): Promise<number> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const assignments = await this.prisma.shiftAssignment.findMany({
      where: {
        userId,
        shift: {
          startTime: { gte: dayStart, lte: dayEnd },
        },
      },
      include: { shift: true },
    });

    return assignments.reduce((total, a) => {
      const hours = differenceInHours(a.shift.endTime, a.shift.startTime);
      return total + hours;
    }, 0);
  }

  async checkShiftAssignment(userId: string, shiftStart: Date, shiftEnd: Date) {
    const warnings = [];

    // Check weekly hours
    const weekStart = this.getWeekStart(shiftStart);
    const currentWeekly = await this.calculateWeeklyHours(userId, weekStart);
    const shiftHours = differenceInHours(shiftEnd, shiftStart);
    const newWeekly = currentWeekly + shiftHours;

    if (newWeekly > 40) {
      warnings.push({
        type: 'WEEKLY_OVERTIME',
        current: currentWeekly,
        new: newWeekly,
        message: `This assignment would exceed 40 hours (${newWeekly.toFixed(1)} total)`,
      });
    } else if (newWeekly > 35) {
      warnings.push({
        type: 'WEEKLY_WARNING',
        current: currentWeekly,
        new: newWeekly,
        message: `Approaching overtime: ${newWeekly.toFixed(1)} hours this week`,
      });
    }

    // Check daily hours
    const currentDaily = await this.calculateDailyHours(userId, shiftStart);
    const newDaily = currentDaily + shiftHours;

    if (newDaily > 12) {
      warnings.push({
        type: 'DAILY_OVERTIME',
        current: currentDaily,
        new: newDaily,
        message: `This would exceed 12 hours in a day (${newDaily.toFixed(1)} total)`,
      });
    } else if (newDaily > 8) {
      warnings.push({
        type: 'DAILY_WARNING',
        current: currentDaily,
        new: newDaily,
        message: `Long shift: ${newDaily.toFixed(1)} hours today`,
      });
    }

    // Check consecutive days
    const consecutiveDays = await this.calculateConsecutiveDays(userId, shiftStart);
    
    if (consecutiveDays === 7) {
      warnings.push({
        type: 'MAX_CONSECUTIVE',
        days: consecutiveDays,
        message: 'Cannot work 7 consecutive days',
      });
    } else if (consecutiveDays === 6) {
      warnings.push({
        type: 'CONSECUTIVE_WARNING',
        days: consecutiveDays,
        message: 'This would be the 6th consecutive day',
      });
    }

    // Create warnings in database
    for (const warning of warnings) {
      await this.createWarning({
        userId,
        weekStart,
        totalHours: newWeekly,
        warningType: this.mapWarningType(warning.type),
        details: warning,
      });
    }

    return {
      allowed: !warnings.some(w => 
        w.type === 'WEEKLY_OVERTIME' || 
        w.type === 'DAILY_OVERTIME' || 
        w.type === 'MAX_CONSECUTIVE'
      ),
      warnings,
    };
  }

  // ========== REPORTS ==========

  async generateOvertimeReport(reportDto: OvertimeReportDto): Promise<OvertimeReportResponseDto> {
    const { startDate, endDate, locationId, userId, groupBy } = reportDto;

    // Get all assignments in date range
    const where: any = {
      shift: {
        startTime: { gte: startDate, lte: endDate },
      },
    };

    if (userId) where.userId = userId;
    if (locationId) where.shift.locationId = locationId;

    const assignments = await this.prisma.shiftAssignment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            desiredHours: true,
          },
        },
        shift: {
          select: {
            startTime: true,
            endTime: true,
            locationId: true,
          },
        },
      },
      orderBy: { shift: { startTime: 'asc' } },
    });

    // Group by user
    const userMap = new Map<string, OvertimeSummaryDto>();
    
    for (const assignment of assignments) {
      const userId = assignment.userId;
      const hours = differenceInHours(assignment.shift.endTime, assignment.shift.startTime);
      
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          userName: `${assignment.user.firstName} ${assignment.user.lastName}`,
          totalHours: 0,
          regularHours: 0,
          overtimeHours: 0,
          doubleOvertimeHours: 0,
          overtimeCost: 0,
          warnings: 0,
          riskLevel: 'LOW',
        });
      }

      const userData = userMap.get(userId)!;
      userData.totalHours += hours;

      // Calculate overtime (over 40 hours/week)
      // This is simplified - real calculation would need weekly grouping
      if (userData.totalHours > 40) {
        const overtime = userData.totalHours - 40;
        userData.overtimeHours = overtime;
        userData.regularHours = 40;
        
        if (overtime > 10) {
          userData.doubleOvertimeHours = overtime - 10;
        }
      } else {
        userData.regularHours = userData.totalHours;
      }
    }

    // Calculate summary stats
    const details = Array.from(userMap.values());
    const employeesWithOvertime = details.filter(d => d.overtimeHours > 0).length;
    const totalOvertimeHours = details.reduce((sum, d) => sum + d.overtimeHours, 0);
    const totalOvertimeCost = totalOvertimeHours * 1.5 * 25; // Assuming $25/hr base * 1.5

    // Calculate chart data
    const chartData = await this.prepareChartData(assignments, groupBy || ReportPeriod.WEEK);

    return {
      period: {
        startDate,
        endDate,
        groupBy: groupBy || ReportPeriod.WEEK,
      },
      summary: {
        totalEmployees: details.length,
        employeesWithOvertime,
        totalOvertimeHours,
        totalOvertimeCost,
        projectedOvertimeCost: totalOvertimeCost * 1.1, // Simple projection
      },
      details,
      chartData,
      timestamp: new Date(),
    };
  }

  async generateFairnessReport(reportDto: FairnessReportDto): Promise<FairnessReportResponseDto> {
    const { startDate, endDate, locationId, threshold = 35 } = reportDto;

    // Get all staff at location
    const where: any = {
      role: 'STAFF',
    };

    if (locationId) {
      where.certifications = {
        some: { locationId }
      };
    }

    const staff = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        desiredHours: true,
        assignedShifts: {
          where: {
            shift: {
              startTime: { gte: startDate, lte: endDate },
              ...(locationId && { locationId }),
            },
          },
          include: {
            shift: {
              select: {
                startTime: true,
                endTime: true,
                title: true,
              },
            },
          },
        },
      },
    });

    // Calculate hours per staff member
    const staffHours: StaffHoursDto[] = staff.map(s => {
      const totalHours = s.assignedShifts.reduce((sum, a) => 
        sum + differenceInHours(a.shift.endTime, a.shift.startTime), 0
      );

      const shiftCount = s.assignedShifts.length;
      const avgShiftLength = shiftCount > 0 ? totalHours / shiftCount : 0;
      const desired = s.desiredHours || 40;
      const variance = totalHours - desired;

      return {
        userId: s.id,
        userName: `${s.firstName} ${s.lastName}`,
        totalHours,
        shiftCount,
        premiumShiftCount: 0, // Would need premium shift logic
        averageShiftLength: avgShiftLength,
        desiredHours: desired,
        hoursVariance: variance,
        riskLevel: variance < -10 ? 'UNDER' : variance > 10 ? 'OVER' : 'TARGET',
      };
    });

    // Sort and find extremes
    const sorted = [...staffHours].sort((a, b) => a.totalHours - b.totalHours);
    const mostUnderScheduled = sorted.slice(0, 5);
    const mostOverScheduled = sorted.slice(-5).reverse();

    // Calculate statistics
    const hours = staffHours.map(s => s.totalHours);
    const avgHours = hours.reduce((a, b) => a + b, 0) / hours.length || 0;
    const medianHours = this.calculateMedian(hours);
    const stdDevHours = this.calculateStdDev(hours, avgHours);
    const giniCoefficient = this.calculateGini(hours);

    // Prepare distribution data
    const distribution = {
      labels: ['0-20', '21-30', '31-40', '41-50', '50+'],
      data: [
        hours.filter(h => h <= 20).length,
        hours.filter(h => h > 20 && h <= 30).length,
        hours.filter(h => h > 30 && h <= 40).length,
        hours.filter(h => h > 40 && h <= 50).length,
        hours.filter(h => h > 50).length,
      ],
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(staffHours, avgHours);

    return {
      period: { startDate, endDate },
      summary: {
        totalStaff: staff.length,
        averageHours: avgHours,
        medianHours,
        stdDevHours,
        giniCoefficient,
        mostUnderScheduled,
        mostOverScheduled,
      },
      distribution,
      premiumShiftDistribution: [], // Would need premium shift logic
      recommendations,
      timestamp: new Date(),
    };
  }

  // ========== PROJECTIONS ==========

  async projectOvertimeCosts(
    locationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const currentReport = await this.generateOvertimeReport({
      locationId,
      startDate,
      endDate,
    });

    // Simple projection based on current trends
    const projected = {
      ...currentReport.summary,
      projectedTotalOvertimeHours: currentReport.summary.totalOvertimeHours * 1.15,
      projectedTotalOvertimeCost: currentReport.summary.totalOvertimeCost * 1.15,
      confidence: 0.85,
      factors: [
        'Based on current scheduling patterns',
        'Historical seasonal variation',
        'Current staffing levels',
      ],
    };

    return {
      period: currentReport.period,
      current: currentReport.summary,
      projected,
      highRiskEmployees: currentReport.details
        .filter(d => d.overtimeHours > 10)
        .map(d => d.userName),
      timestamp: new Date(),
    };
  }

  async identifyOvertimeRisks(locationId: string): Promise<any> {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const weekAfter = new Date();
    weekAfter.setDate(weekAfter.getDate() + 14);

    const upcomingShifts = await this.prisma.shift.findMany({
      where: {
        locationId,
        startTime: { gte: nextWeek, lte: weekAfter },
      },
      include: {
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
    });

    // Group by user
    const userHours: Record<string, { name: string; hours: number }> = {};

    for (const shift of upcomingShifts) {
      for (const assignment of shift.assignments) {
        const userId = assignment.userId;
        const hours = differenceInHours(shift.endTime, shift.startTime);
        
        if (!userHours[userId]) {
          userHours[userId] = {
            name: `${assignment.user.firstName} ${assignment.user.lastName}`,
            hours: 0,
          };
        }
        userHours[userId].hours += hours;
      }
    }

    // Identify risks
    const risks = Object.entries(userHours)
      .map(([userId, data]) => ({
        userId,
        name: data.name,
        projectedHours: data.hours,
        riskLevel: data.hours > 40 ? 'HIGH' : data.hours > 35 ? 'MEDIUM' : 'LOW',
        warningThreshold: data.hours > 35,
        overtimeThreshold: data.hours > 40,
      }))
      .filter(r => r.riskLevel !== 'LOW');

    return {
      period: {
        startDate: nextWeek,
        endDate: weekAfter,
      },
      totalShifts: upcomingShifts.length,
      totalStaff: Object.keys(userHours).length,
      risks,
      recommendations: risks.map(r => 
        `Consider adjusting ${r.name}'s schedule to reduce hours from ${r.projectedHours.toFixed(1)} to under 40`
      ),
      timestamp: new Date(),
    };
  }

  // ========== UTILITY METHODS ==========

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private async calculateConsecutiveDays(userId: string, newShiftStart: Date): Promise<number> {
    const sevenDaysBefore = new Date(newShiftStart);
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);

    const assignments = await this.prisma.shiftAssignment.findMany({
      where: {
        userId,
        shift: {
          startTime: { gte: sevenDaysBefore, lt: newShiftStart },
        },
      },
      include: { shift: true },
      orderBy: { shift: { startTime: 'asc' } },
    });

    if (assignments.length === 0) return 1;

    let consecutive = 1;
    let currentDate = new Date(assignments[assignments.length - 1].shift.startTime);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = assignments.length - 2; i >= 0; i--) {
      const shiftDate = new Date(assignments[i].shift.startTime);
      shiftDate.setHours(0, 0, 0, 0);
      
      const dayDiff = Math.floor(
        (currentDate.getTime() - shiftDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (dayDiff === 1) {
        consecutive++;
        currentDate = shiftDate;
      } else {
        break;
      }
    }

    return consecutive;
  }

  private getWarningTitle(type: WarningType): string {
    const titles = {
      WEEKLY_HOURS: 'Weekly Overtime Warning',
      DAILY_HOURS: 'Daily Hours Warning',
      CONSECUTIVE_DAYS: 'Consecutive Days Warning',
      NO_REST_PERIOD: 'Insufficient Rest Period',
    };
    return titles[type];
  }

  private getWarningMessage(warning: CreateOvertimeWarningDto): string {
    const messages = {
      WEEKLY_HOURS: `You have worked ${warning.totalHours.toFixed(1)} hours this week. Overtime starts at 40 hours.`,
      DAILY_HOURS: `You have worked ${warning.totalHours.toFixed(1)} hours today. Maximum is 12 hours.`,
      CONSECUTIVE_DAYS: `This is your ${warning.totalHours}th consecutive day worked.`,
      NO_REST_PERIOD: 'You need at least 10 hours between shifts.',
    };
    return messages[warning.warningType] || 'Overtime warning';
  }

  private mapWarningType(type: string): WarningType {
    const map: Record<string, WarningType> = {
      WEEKLY_OVERTIME: WarningType.WEEKLY_HOURS,
      WEEKLY_WARNING: WarningType.WEEKLY_HOURS,
      DAILY_OVERTIME: WarningType.DAILY_HOURS,
      DAILY_WARNING: WarningType.DAILY_HOURS,
      MAX_CONSECUTIVE: WarningType.CONSECUTIVE_DAYS,
      CONSECUTIVE_WARNING: WarningType.CONSECUTIVE_DAYS,
    };
    return map[type] || WarningType.WEEKLY_HOURS;
  }

  private async notifyManagers(userId: string, warning: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        certifications: {
          select: { locationId: true },
        },
      },
    });

    if (!user) return;

    const locationIds = user.certifications.map(c => c.locationId);

    const managers = await this.prisma.user.findMany({
      where: {
        role: 'MANAGER',
        managedLocations: {
          some: { id: { in: locationIds } },
        },
      },
    });

    for (const manager of managers) {
      await this.notificationsService.create({
        userId: manager.id,
        type: 'OVERTIME_WARNING',
        title: 'Staff Overtime Alert',
        message: `${user.firstName} ${user.lastName} has exceeded overtime thresholds`,
        data: { 
          warningId: warning.id,
          userId,
          hours: warning.totalHours,
        },
      });
    }
  }

  private prepareChartData(assignments: any[], groupBy: ReportPeriod): any {
  const labels: string[] = [];
  const regularData: number[] = [];
  const overtimeData: number[] = [];

  // Group by period
  const grouped = new Map<string, { regular: number; overtime: number }>();

  for (const assignment of assignments) {
    const date = new Date(assignment.shift.startTime);
    let key: string;

    switch (groupBy) {
      case ReportPeriod.DAY:
        key = date.toISOString().split('T')[0];
        break;
      case ReportPeriod.WEEK:
        const weekStart = startOfWeek(date);
        key = weekStart.toISOString().split('T')[0];
        break;
      case ReportPeriod.MONTH:
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!grouped.has(key)) {
      grouped.set(key, { regular: 0, overtime: 0 });
    }

    const hours = differenceInHours(assignment.shift.endTime, assignment.shift.startTime);
    const data = grouped.get(key)!;

    // Simplified - in reality would track per-employee thresholds
    if (hours > 8) {
      data.overtime += hours - 8;
      data.regular += 8;
    } else {
      data.regular += hours;
    }
  }

  // Convert to arrays
  const sortedKeys = Array.from(grouped.keys()).sort();
  for (const key of sortedKeys) {
    labels.push(key);
    regularData.push(grouped.get(key)!.regular);
    overtimeData.push(grouped.get(key)!.overtime);
  }

  return {
    labels,
    datasets: {
      regular: regularData,
      overtime: overtimeData,
    },
  };
}

  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private calculateStdDev(numbers: number[], mean: number): number {
    if (numbers.length === 0) return 0;
    const squareDiffs = numbers.map(n => Math.pow(n - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / numbers.length;
    return Math.sqrt(avgSquareDiff);
  }

  private calculateGini(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    if (sum === 0) return 0;

    let gini = 0;
    for (let i = 0; i < n; i++) {
      gini += (2 * i - n - 1) * sorted[i];
    }
    gini = Math.abs(gini) / (n * sum);

    return gini;
  }

  private generateRecommendations(staffHours: StaffHoursDto[], avgHours: number): string[] {
    const recommendations: string[] = [];

    const underScheduled = staffHours.filter(s => s.riskLevel === 'UNDER');
    const overScheduled = staffHours.filter(s => s.riskLevel === 'OVER');

    if (underScheduled.length > 0) {
      recommendations.push(
        `${underScheduled.length} staff members are under-scheduled. Consider offering them more shifts.`
      );
    }

    if (overScheduled.length > 0) {
      recommendations.push(
        `${overScheduled.length} staff members are over-scheduled. Review their workload.`
      );
    }

    const highVariance = staffHours.filter(s => Math.abs(s.hoursVariance) > 15);
    if (highVariance.length > 0) {
      recommendations.push(
        `${highVariance.length} staff have hours far from their desired range. Review with them.`
      );
    }

    return recommendations;
  }
}