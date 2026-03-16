// backend/src/modules/notifications/notifications.controller.ts
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
import { NotificationsService } from './notifications.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('notifications')
@UseGuards(RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationsService.findAllForUser(user.id, +page, +limit);
  }

  @Get('unread')
  async findUnread(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationsService.findUnreadForUser(user.id, +page, +limit);
  }

  @Get('unread/count')
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Get('preferences')
  async getPreferences(@CurrentUser() user: any) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch('preferences')
  async updatePreferences(
    @CurrentUser() user: any,
    @Body() updatePrefsDto: UpdatePreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(user.id, updatePrefsDto);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Patch(':id/archive')
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.archive(id, user.id);
  }

  @Delete('old')
  @Roles('ADMIN')
  async deleteOldNotifications(@Query('days') days = 30) {
    return this.notificationsService.deleteOldNotifications(+days);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.findOne(id, user.id);
  }
}