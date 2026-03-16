// backend/src/modules/skills/skills.controller.ts
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
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LocationAccessGuard } from '../../common/guards/location-access.guard';
import { LocationAccess } from '../../common/decorators/location-access.decorator';

@Controller()
@UseGuards(RolesGuard, LocationAccessGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  // ========== SKILL ENDPOINTS ==========

  @Post('skills')
  @Roles('ADMIN', 'MANAGER')
  async createSkill(
    @Body() createSkillDto: CreateSkillDto,
    @CurrentUser() user: any,
  ) {
    return this.skillsService.createSkill(createSkillDto, user.id);
  }

  @Get('skills')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async findAllSkills(
    @Query('category') category?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('includeInactive') includeInactive = false,
  ) {
    return this.skillsService.findAllSkills(category, +page, +limit, includeInactive);
  }

  @Get('skills/categories')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async getSkillCategories() {
    return this.skillsService.getSkillCategories();
  }

  @Get('skills/:id')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async findOneSkill(@Param('id') id: string) {
    return this.skillsService.findOneSkill(id);
  }

  @Patch('skills/:id')
  @Roles('ADMIN', 'MANAGER')
  async updateSkill(
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
    @CurrentUser() user: any,
  ) {
    return this.skillsService.updateSkill(id, updateSkillDto, user.id);
  }

  @Delete('skills/:id')
  @Roles('ADMIN')
  async removeSkill(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.skillsService.removeSkill(id, user.id);
  }

  // ========== CERTIFICATION ENDPOINTS ==========

  @Post('certifications')
  @Roles('ADMIN', 'MANAGER')
  @LocationAccess({ body: 'locationId' })
  async createCertification(
    @Body() createCertificationDto: CreateCertificationDto,
    @CurrentUser() user: any,
  ) {
    return this.skillsService.createCertification(createCertificationDto, user.id);
  }

  @Get('certifications')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async findAllCertifications(
    @Query('userId') userId?: string,
    @Query('skillId') skillId?: string,
    @Query('locationId') locationId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.skillsService.findAllCertifications(userId, skillId, locationId, +page, +limit);
  }

  @Get('certifications/expiring')
  @Roles('ADMIN', 'MANAGER')
  async getExpiringCertifications(
    @Query('days') days = 30,
  ) {
    return this.skillsService.getExpiringCertifications(+days);
  }

  @Get('certifications/user/:userId')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async getUserCertifications(@Param('userId') userId: string) {
    return this.skillsService.getUserCertifications(userId);
  }

  @Get('certifications/location/:locationId')
  @Roles('ADMIN', 'MANAGER')
  @LocationAccess({ param: 'locationId' })
  async getLocationCertifications(@Param('locationId') locationId: string) {
    return this.skillsService.getLocationCertifications(locationId);
  }

  @Get('certifications/:id')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async findOneCertification(@Param('id') id: string) {
    return this.skillsService.findOneCertification(id);
  }

  @Delete('certifications/:id')
  @Roles('ADMIN', 'MANAGER')
  async revokeCertification(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.skillsService.revokeCertification(id, user.id);
  }
}