// backend/src/modules/swap-requests/swap-requests.controller.ts
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
import { SwapRequestsService } from './swap-requests.service';
import { CreateSwapRequestDto } from './dto/create-swap-request.dto';
import { RespondSwapDto } from './dto/respond-swap.dto';
import { ApproveSwapDto } from './dto/approve-swap.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LocationAccessGuard } from '../../common/guards/location-access.guard';
import { LocationAccess } from '../../common/decorators/location-access.decorator';
import { SwapRequestStatus, SwapRequestType } from '@prisma/client';

@Controller('swap-requests')
@UseGuards(RolesGuard, LocationAccessGuard)
export class SwapRequestsController {
  constructor(private readonly swapRequestsService: SwapRequestsService) {}

  @Post()
  @Roles('STAFF')
  async create(
    @Body() createSwapDto: CreateSwapRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.swapRequestsService.createSwapRequest(user.id, createSwapDto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('status') status?: SwapRequestStatus,
    @Query('type') type?: SwapRequestType,
    @Query('locationId') locationId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.swapRequestsService.findAll(user.id, user.role, {
      status,
      type,
      locationId,
      page: +page,
      limit: +limit,
    });
  }

  @Get('available-drops')
  @Roles('STAFF')
  async findAvailableDrops(
    @Query('locationId') locationId?: string,
    @Query('skillId') skillId?: string,
  ) {
    return this.swapRequestsService.findAvailableDrops(locationId, skillId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.swapRequestsService.findOne(id);
  }

  @Post(':id/respond')
  @Roles('STAFF')
  @HttpCode(HttpStatus.OK)
  async respond(
    @Param('id') id: string,
    @Body() respondDto: RespondSwapDto,
    @CurrentUser() user: any,
  ) {
    return this.swapRequestsService.respondToSwap(user.id, id, respondDto);
  }

  @Post(':id/approve')
  @Roles('MANAGER')
  @HttpCode(HttpStatus.OK)
  @LocationAccess({ param: 'id' })
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveSwapDto,
    @CurrentUser() user: any,
  ) {
    return this.swapRequestsService.approveSwap(user.id, id, approveDto);
  }

  @Delete(':id')
  @Roles('STAFF', 'MANAGER')
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.swapRequestsService.cancelRequest(user.id, id);
  }

  @Post('cleanup')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async cleanupExpired() {
    return this.swapRequestsService.cleanupExpiredRequests();
  }
}