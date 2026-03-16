// backend/src/modules/audit/audit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { AuditExportDto } from './dto/audit-export.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  // ========== LOG CREATION ==========

  async log(createAuditLogDto: CreateAuditLogDto) {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          actorId: createAuditLogDto.actorId,
          action: createAuditLogDto.action,
          entityType: createAuditLogDto.entityType,
          entityId: createAuditLogDto.entityId,
          beforeState: createAuditLogDto.beforeState || {},
          afterState: createAuditLogDto.afterState || {},
          changes: createAuditLogDto.changes || this.computeChanges(
            createAuditLogDto.beforeState,
            createAuditLogDto.afterState
          ),
          ipAddress: createAuditLogDto.ipAddress,
          userAgent: createAuditLogDto.userAgent,
          location: createAuditLogDto.location,
        },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      this.logger.debug(`Audit log created: ${auditLog.action} on ${auditLog.entityType}`);

      return new AuditLogResponseDto(auditLog);
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
      // Don't throw - audit logging should not break the main operation
      return null;
    }
  }

  async logBulk(logs: CreateAuditLogDto[]) {
    try {
      const result = await this.prisma.$transaction(
        logs.map(log =>
          this.prisma.auditLog.create({
            data: {
              actorId: log.actorId,
              action: log.action,
              entityType: log.entityType,
              entityId: log.entityId,
              beforeState: log.beforeState || {},
              afterState: log.afterState || {},
              changes: log.changes || this.computeChanges(log.beforeState, log.afterState),
              ipAddress: log.ipAddress,
              userAgent: log.userAgent,
              location: log.location,
            },
          })
        )
      );

      this.logger.debug(`Created ${result.length} audit logs in bulk`);

      return result.map(log => new AuditLogResponseDto(log));
    } catch (error) {
      this.logger.error(`Failed to create bulk audit logs: ${error.message}`);
      return [];
    }
  }

  // ========== QUERY METHODS ==========

  async findAll(
    page = 1,
    limit = 20,
    filters?: {
      actorId?: string;
      action?: string;
      entityType?: string;
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const skip = (page - 1) * limit;
    
    const where: any = {};

    if (filters?.actorId) where.actorId = filters.actorId;
    if (filters?.action) where.action = filters.action;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.entityId) where.entityId = filters.entityId;
    
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs.map(log => new AuditLogResponseDto(log)),
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
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      return null;
    }

    return new AuditLogResponseDto(log);
  }

  async findByEntity(entityType: string, entityId: string, page = 1, limit = 20) {
    return this.findAll(page, limit, { entityType, entityId });
  }

  async findByActor(actorId: string, page = 1, limit = 20) {
    return this.findAll(page, limit, { actorId });
  }

  async findByAction(action: string, page = 1, limit = 20) {
    return this.findAll(page, limit, { action });
  }

  async findByDateRange(startDate: Date, endDate: Date, page = 1, limit = 20) {
    return this.findAll(page, limit, { startDate, endDate });
  }

  // ========== EXPORT METHODS ==========

  async export(exportDto: AuditExportDto) {
    const where: any = {};

    if (exportDto.startDate || exportDto.endDate) {
      where.createdAt = {};
      if (exportDto.startDate) where.createdAt.gte = exportDto.startDate;
      if (exportDto.endDate) where.createdAt.lte = exportDto.endDate;
    }

    if (exportDto.actorId) where.actorId = exportDto.actorId;
    if (exportDto.action) where.action = exportDto.action;
    if (exportDto.entityType) where.entityType = exportDto.entityType;
    if (exportDto.entityId) where.entityId = exportDto.entityId;

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const transformedLogs = logs.map(log => new AuditLogResponseDto(log));

    if (exportDto.format === 'csv') {
      return this.convertToCSV(transformedLogs, exportDto.fields);
    }

    return transformedLogs;
  }

  // ========== ANALYTICS METHODS ==========

  async getStats(startDate: Date, endDate: Date) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by action
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by entity type
    const entityCounts = logs.reduce((acc, log) => {
      acc[log.entityType] = (acc[log.entityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by day
    const dailyCounts = logs.reduce((acc, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top actors
    const actorCounts = logs.reduce((acc, log) => {
      if (log.actorId) {
        acc[log.actorId] = (acc[log.actorId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topActors = Object.entries(actorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([actorId, count]) => ({ actorId, count }));

    return {
      dateRange: { startDate, endDate },
      totalLogs: logs.length,
      actionCounts,
      entityCounts,
      dailyCounts,
      topActors,
      averagePerDay: logs.length / this.getDaysBetween(startDate, endDate),
    };
  }

  async getUserActivity(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        actorId: userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by action
    const actionSummary = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by day
    const dailyActivity = logs.reduce((acc, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push({
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        time: log.createdAt,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return {
      userId,
      period: `${days} days`,
      totalActions: logs.length,
      actionSummary,
      dailyActivity,
      lastActive: logs[0]?.createdAt || null,
    };
  }

  async getEntityHistory(entityType: string, entityId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Build timeline
    const timeline = logs.map(log => ({
      timestamp: log.createdAt,
      action: log.action,
      actor: log.actor,
      changes: log.changes,
      beforeState: log.beforeState,
      afterState: log.afterState,
    }));

    return {
      entityType,
      entityId,
      totalEvents: logs.length,
      firstEvent: logs[0]?.createdAt || null,
      lastEvent: logs[logs.length - 1]?.createdAt || null,
      timeline,
    };
  }

  // ========== UTILITY METHODS ==========

  private computeChanges(before: any, after: any): Record<string, any> {
    if (!before || !after) return {};

    const changes: Record<string, any> = {};

    // Get all keys from both objects
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      const beforeValue = before[key];
      const afterValue = after[key];

      // Compare values
      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changes[key] = {
          before: beforeValue,
          after: afterValue,
        };
      }
    }

    return changes;
  }

  private getDaysBetween(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private convertToCSV(logs: AuditLogResponseDto[], fields?: string[]): string {
    const defaultFields = ['id', 'action', 'entityType', 'entityId', 'createdAt', 'actorId'];
    const selectedFields = fields || defaultFields;

    // Create header
    const header = selectedFields.join(',');

    // Create rows
    const rows = logs.map(log => {
      return selectedFields
        .map(field => {
          const value = log[field as keyof AuditLogResponseDto];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
          return String(value);
        })
        .join(',');
    });

    return [header, ...rows].join('\n');
  }

  // ========== CLEANUP METHODS ==========

  async deleteOldLogs(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { count } = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Deleted ${count} audit logs older than ${daysOld} days`);

    return {
      success: true,
      message: `Deleted ${count} old audit logs`,
      timestamp: new Date().toISOString(),
    };
  }

  async archiveOldLogs(daysOld = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldLogs = await this.prisma.auditLog.findMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    // TODO: Archive to cold storage (S3, etc.)
    // Then delete from database
    await this.deleteOldLogs(daysOld);

    return {
      success: true,
      message: `Archived ${oldLogs.length} audit logs`,
      timestamp: new Date().toISOString(),
    };
  }
}