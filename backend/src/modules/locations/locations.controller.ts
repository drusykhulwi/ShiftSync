// backend/src/modules/locations/locations.controller.ts
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
  HttpStatus 
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LocationAccessGuard } from '../../common/guards/location-access.guard';
import { LocationAccess } from '../../common/decorators/location-access.decorator';

@Controller('locations')
@UseGuards(RolesGuard, LocationAccessGuard)
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly prisma: PrismaService, // This is the ONLY declaration
  ) {}

  @Post()
  @Roles('ADMIN')
  async create(
    @Body() createLocationDto: CreateLocationDto,
    @CurrentUser() user: any,
  ) {
    return this.locationsService.create(createLocationDto, user.id);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('includeInactive') includeInactive = false,
  ) {
    // Managers only see active locations
    if (user.role === 'MANAGER') {
      includeInactive = false;
    }
    return this.locationsService.findAll(+page, +limit, includeInactive);
  }

  @Get('my-locations')
  @Roles('MANAGER')
  async getMyLocations(@CurrentUser() user: any) {
    const locations = await this.prisma.location.findMany({
      where: {
        managers: { some: { id: user.id } },
        isActive: true,
      },
    });
    return { data: locations };
  }

  @Get('stats/:id')
  @Roles('ADMIN', 'MANAGER')
  @LocationAccess({ param: 'id' })
  async getLocationStats(@Param('id') id: string) {
    return this.locationsService.getLocationStats(id);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER')
  @LocationAccess({ param: 'id' })
  async findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @CurrentUser() user: any,
  ) {
    return this.locationsService.update(id, updateLocationDto, user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.locationsService.remove(id, user.id);
  }

  @Post(':id/managers/:managerId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async assignManager(
    @Param('id') id: string,
    @Param('managerId') managerId: string,
    @CurrentUser() user: any,
  ) {
    return this.locationsService.assignManager(id, managerId, user.id);
  }

  @Delete(':id/managers/:managerId')
  @Roles('ADMIN')
  async removeManager(
    @Param('id') id: string,
    @Param('managerId') managerId: string,
    @CurrentUser() user: any,
  ) {
    return this.locationsService.removeManager(id, managerId, user.id);
  }
}