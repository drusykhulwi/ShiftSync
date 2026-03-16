// backend/src/modules/overtime/overtime.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException  
} from '@nestjs/common';
import { OvertimeService } from './overtime.service';
import { 
  AcknowledgeWarningDto, 
  ResolveWarningDto 
} from './dto/acknowledge-warning.dto';
import { 
  OvertimeReportDto, 
  OvertimeReportResponseDto 
} from './dto/overtime-report.dto';
import { 
  FairnessReportDto, 
  FairnessReportResponseDto 
} from './dto/fairness-report.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LocationAccessGuard } from '../../common/guards/location-access.guard';
import { LocationAccess } from '../../common/decorators/location-access.decorator';

@Controller('overtime')
@UseGuards(RolesGuard, LocationAccessGuard)
export class OvertimeController {
  constructor(private readonly overtimeService: OvertimeService) {}

  // ========== WARNINGS ==========

  @Get('warnings')
  @Roles('ADMIN', 'MANAGER')
  async getWarnings(
    @CurrentUser() user: any,
    @Query('userId') userId?: string,
    @Query('locationId') locationId?: string,
    @Query('acknowledged') acknowledged = false,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    // Managers can only see their location
    if (user.role === 'MANAGER' && !locationId) {
      locationId = user.locations?.[0];
    }

    return this.overtimeService.getWarnings(
      userId,
      locationId,
      acknowledged === true,
      +page,
      +limit
    );
  }

  @Get('warnings/my')
  @Roles('STAFF')
  async getMyWarnings(
    @CurrentUser() user: any,
    @Query('acknowledged') acknowledged = false,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.overtimeService.getWarnings(
      user.id,
      undefined,
     acknowledged === true,
      +page,
      +limit
    );
  }

  @Patch('warnings/:id/acknowledge')
  @Roles('STAFF', 'MANAGER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async acknowledgeWarning(
    @Param('id') id: string,
    @Body() dto: AcknowledgeWarningDto,
    @CurrentUser() user: any,
  ) {
    return this.overtimeService.acknowledgeWarning(id, user.id, dto.notes);
  }

  @Patch('warnings/:id/resolve')
  @Roles('MANAGER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async resolveWarning(
    @Param('id') id: string,
    @Body() dto: ResolveWarningDto,
    @CurrentUser() user: any,
  ) {
    return this.overtimeService.resolveWarning(id, user.id, dto.resolution);
  }

  // ========== REPORTS ==========

  @Post('reports/overtime')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  async generateOvertimeReport(
    @Body() reportDto: OvertimeReportDto,
    @CurrentUser() user: any,
  ) {
    // Managers can only see their location
    if (user.role === 'MANAGER' && !reportDto.locationId) {
      reportDto.locationId = user.locations?.[0];
    }

    return this.overtimeService.generateOvertimeReport(reportDto);
  }

  @Post('reports/fairness')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  async generateFairnessReport(
    @Body() reportDto: FairnessReportDto,
    @CurrentUser() user: any,
  ) {
    // Managers can only see their location
    if (user.role === 'MANAGER' && !reportDto.locationId) {
      reportDto.locationId = user.locations?.[0];
    }

    return this.overtimeService.generateFairnessReport(reportDto);
  }

  @Get('reports/projections')
  @Roles('ADMIN', 'MANAGER')
  async getOvertimeProjections(
    @Query('locationId') locationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    // Managers can only see their location
    if (user.role === 'MANAGER' && !locationId) {
      locationId = user.locations?.[0];
    }

    return this.overtimeService.projectOvertimeCosts(
      locationId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get('reports/risks')
  @Roles('ADMIN', 'MANAGER')
  @LocationAccess({ param: 'locationId' })
  async identifyOvertimeRisks(
    @Query('locationId') locationId: string,
    @CurrentUser() user: any,
  ) {
    return this.overtimeService.identifyOvertimeRisks(locationId);
  }

  // ========== HOURLY CALCULATIONS ==========

  @Get('calculate/weekly/:userId')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async calculateWeeklyHours(
    @Param('userId') userId: string,
    @Query('date') date: string,
    @CurrentUser() user: any,
  ) {
    // Staff can only check themselves
    if (user.role === 'STAFF' && user.id !== userId) {
      throw new ForbiddenException('You can only check your own hours');
    }

    const weekStart = new Date(date);
    return this.overtimeService.calculateWeeklyHours(userId, weekStart);
  }

  @Get('calculate/daily/:userId')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async calculateDailyHours(
    @Param('userId') userId: string,
    @Query('date') date: string,
    @CurrentUser() user: any,
  ) {
    // Staff can only check themselves
    if (user.role === 'STAFF' && user.id !== userId) {
      throw new ForbiddenException('You can only check your own hours');
    }

    return this.overtimeService.calculateDailyHours(userId, new Date(date));
  }

  @Post('check-assignment')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  async checkShiftAssignment(
    @Body() dto: { userId: string; shiftStart: Date; shiftEnd: Date },
  ) {
    return this.overtimeService.checkShiftAssignment(
      dto.userId,
      new Date(dto.shiftStart),
      new Date(dto.shiftEnd)
    );
  }
}