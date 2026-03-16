// backend/src/modules/shifts/shifts.controller.ts
// backend/src/modules/shifts/shifts.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException  
} from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { AssignStaffDto } from './dto/assign-staff.dto';
import { PublishScheduleDto } from './dto/publish-schedule.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LocationAccessGuard } from '../../common/guards/location-access.guard';
import { LocationAccess } from '../../common/decorators/location-access.decorator';
import { ShiftStatus } from '@prisma/client';

@Controller('shifts')
@UseGuards(RolesGuard, LocationAccessGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @LocationAccess({ body: 'locationId' })
  async create(
    @Body() createShiftDto: CreateShiftDto,
    @CurrentUser() user: any,
  ) {
    return this.shiftsService.create(createShiftDto, user.id);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async findAll(
    @CurrentUser() user: any,
    @Query('locationId') locationId?: string,
    @Query('status') status?: ShiftStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    // Staff can only see their location
    if (user.role === 'STAFF' && !locationId) {
      // Staff should have location from their certifications
      // This would need to be implemented
    }

    return this.shiftsService.findAll(
      locationId,
      status,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      +page,
      +limit,
    );
  }

  @Get('location/:locationId')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @LocationAccess({ param: 'locationId' })
  async findByLocation(
    @Param('locationId') locationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.shiftsService.findByLocation(
      locationId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('overview')
  @Roles('ADMIN', 'MANAGER')
  async getScheduleOverview(
    @Query('locationId') locationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.shiftsService.getScheduleOverview(
      locationId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('conflicts/:userId')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async checkConflicts(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    // Staff can only check their own conflicts
    if (user.role === 'STAFF' && user.id !== userId) {
      throw new ForbiddenException('You can only check your own conflicts');
    }

    return this.shiftsService.checkConflicts(
      userId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  async update(
    @Param('id') id: string,
    @Body() updateShiftDto: UpdateShiftDto,
    @CurrentUser() user: any,
  ) {
    return this.shiftsService.update(id, updateShiftDto, user.id);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.shiftsService.remove(id, user.id);
  }

  @Post(':id/assign')
  @Roles('ADMIN', 'MANAGER')
  async assignStaff(
    @Param('id') id: string,
    @Body() assignStaffDto: AssignStaffDto,
    @CurrentUser() user: any,
  ) {
    return this.shiftsService.assignStaff(id, assignStaffDto, user.id);
  }

  @Delete(':id/assign/:assignmentId')
  @Roles('ADMIN', 'MANAGER')
  async unassignStaff(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.shiftsService.unassignStaff(id, assignmentId, user.id);
  }

  @Post('publish')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  async publishShifts(
    @Body() publishScheduleDto: PublishScheduleDto,
    @CurrentUser() user: any,
  ) {
    return this.shiftsService.publishShifts(publishScheduleDto, user.id);
  }
}