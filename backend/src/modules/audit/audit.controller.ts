// backend/src/modules/audit/audit.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Header 
} from '@nestjs/common';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { AuditExportDto } from './dto/audit-export.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('audit')
@UseGuards(RolesGuard)
@Roles('ADMIN') // Only admins can access audit logs
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.findAll(+page, +limit, {
      actorId,
      action,
      entityType,
      entityId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('stats')
  async getStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.auditService.getStats(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('user/:userId')
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('days') days = 30,
  ) {
    return this.auditService.getUserActivity(userId, +days);
  }

  @Get('entity/:entityType/:entityId')
  async getEntityHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getEntityHistory(entityType, entityId);
  }

  @Get('export')
  async export(@Query() exportDto: AuditExportDto, @Res() res: Response) {
    const data = await this.auditService.export(exportDto);

    if (exportDto.format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', `attachment; filename=audit-export-${new Date().toISOString()}.csv`);
      return res.send(data);
    }

    return res.json(data);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }

  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  async deleteOldLogs(@Query('days') days = 90) {
    return this.auditService.deleteOldLogs(+days);
  }

  @Post('archive')
  @HttpCode(HttpStatus.OK)
  async archiveOldLogs(@Query('days') days = 365) {
    return this.auditService.archiveOldLogs(+days);
  }
}