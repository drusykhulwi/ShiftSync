// backend/src/modules/swap-requests/swap-requests.module.ts
import { Module } from '@nestjs/common';
import { SwapRequestsService } from './swap-requests.service';
import { SwapRequestsController } from './swap-requests.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { ShiftConstraintsValidator } from '../shifts/validators/shift-constraints.validator';

@Module({
  controllers: [SwapRequestsController],
  providers: [
    SwapRequestsService,
    PrismaService,
    NotificationsService,
    AuditService,
    ShiftConstraintsValidator,
  ],
  exports: [SwapRequestsService],
})
export class SwapRequestsModule {}