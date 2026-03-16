// backend/src/modules/shifts/shifts.module.ts
import { Module } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { ShiftConstraintsValidator } from './validators/shift-constraints.validator';
import { PrismaService } from '../../prisma/prisma.service';

// These will be created later
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [ShiftsController],
  providers: [
    ShiftsService,
    ShiftConstraintsValidator,
    PrismaService,
    NotificationsService,
    AuditService,
  ],
  exports: [ShiftsService],
})
export class ShiftsModule {}