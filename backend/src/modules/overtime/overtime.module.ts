// backend/src/modules/overtime/overtime.module.ts
import { Module } from '@nestjs/common';
import { OvertimeService } from './overtime.service';
import { OvertimeController } from './overtime.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [OvertimeController],
  providers: [
    OvertimeService,
    PrismaService,
    NotificationsService,
    AuditService,
  ],
  exports: [OvertimeService],
})
export class OvertimeModule {}