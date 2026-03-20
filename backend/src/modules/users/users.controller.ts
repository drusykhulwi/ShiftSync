// backend/src/modules/users/users.controller.ts
import { 
  Controller, Get, Post, Body, Patch, Put,
  Param, Delete, Query, UseGuards, HttpCode, HttpStatus
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LocationAccessGuard } from '../../common/guards/location-access.guard';
import { LocationAccess } from '../../common/decorators/location-access.decorator';

@Controller('users')
@UseGuards(RolesGuard, LocationAccessGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  async create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: any) {
    return this.usersService.create(createUserDto, user.role, user.id);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  async findAll(
    @CurrentUser() user: any,
    @Query('role') role?: string,
    @Query('locationId') locationId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    if (user.role === 'MANAGER' && !locationId) {
      locationId = user.locations?.[0];
    }
    return this.usersService.findAll(role, locationId, +page, +limit);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.id);
  }

  @Patch('profile')
  async updateProfile(@Body() updateProfileDto: UpdateProfileDto, @CurrentUser() user: any) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Get('staff/:locationId')
  @Roles('MANAGER', 'ADMIN')
  @LocationAccess({ param: 'locationId' })
  async getStaffByLocation(@Param('locationId') locationId: string) {
    return this.usersService.getStaffByLocation(locationId);
  }

  // ── Availability ────────────────────────────────────────────────────────

  @Get(':id/availability')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async getAvailability(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.role === 'STAFF' && user.id !== id) return { data: [] };
    return this.usersService.getAvailability(id);
  }

  @Put(':id/availability')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async setAvailability(
    @Param('id') id: string,
    @Body() body: { availability: any[] },
    @CurrentUser() user: any,
  ) {
    if (user.role === 'STAFF' && user.id !== id) {
      return { success: false, error: 'Cannot update another user\'s availability' };
    }
    return this.usersService.setAvailability(id, body.availability);
  }

  // Add a single exception date
  @Post(':id/availability/exception')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async addException(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    if (user.role === 'STAFF' && user.id !== id) {
      return { success: false, error: 'Cannot update another user\'s availability' };
    }
    return this.usersService.addException(id, body);
  }

  // Delete a specific availability record
  @Delete(':id/availability/:availabilityId')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @HttpCode(HttpStatus.OK)
  async deleteAvailability(
    @Param('id') id: string,
    @Param('availabilityId') availabilityId: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === 'STAFF' && user.id !== id) {
      return { success: false, error: 'Cannot update another user\'s availability' };
    }
    return this.usersService.deleteAvailability(id, availabilityId);
  }

  // ── Standard CRUD ───────────────────────────────────────────────────────

  @Get(':id')
  @Roles('ADMIN', 'MANAGER')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.update(id, updateUserDto, user.role, user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.remove(id, user.role);
  }

  @Post(':userId/certifications')
  @Roles('MANAGER', 'ADMIN')
  async addCertification(
    @Param('userId') userId: string,
    @Body('skillId') skillId: string,
    @Body('locationId') locationId: string,
    @CurrentUser() user: any,
  ) {
    return this.usersService.addCertification(userId, skillId, locationId, user.id);
  }

  @Delete(':userId/certifications/:certificationId')
  @Roles('MANAGER', 'ADMIN')
  async removeCertification(
    @Param('userId') userId: string,
    @Param('certificationId') certificationId: string,
  ) {
    return this.usersService.removeCertification(userId, certificationId);
  }
}