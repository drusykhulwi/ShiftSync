// backend/src/modules/skills/skills.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { SkillResponseDto } from './dto/skill-response.dto';
import { CertificationResponseDto } from './dto/certification-response.dto';
import { ERROR_CODES } from '../../common/constants/error-codes.constants';

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  // ========== SKILL MANAGEMENT ==========

  async createSkill(createSkillDto: CreateSkillDto, userId: string) {
    // Check if skill with same name exists
    const existingSkill = await this.prisma.skill.findUnique({
      where: { name: createSkillDto.name },
    });

    if (existingSkill) {
      throw new ConflictException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Skill with this name already exists',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const skill = await this.prisma.skill.create({
      data: createSkillDto,
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'CREATE',
        entityType: 'Skill',
        entityId: skill.id,
        afterState: JSON.parse(JSON.stringify(skill)),
      },
    });

    return new SkillResponseDto(skill);
  }

  async findAllSkills(
    category?: string, 
    page = 1, 
    limit = 20, 
    includeInactive = false
  ) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }
    
    if (category) {
      where.category = category;
    }

    const [skills, total] = await Promise.all([
      this.prisma.skill.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              certifications: true,
              shiftRequirements: true,
            },
          },
        },
        orderBy: { category: 'asc' },
      }),
      this.prisma.skill.count({ where }),
    ]);

    const transformedSkills = skills.map(skill => {
      const dto = new SkillResponseDto(skill);
      dto.certificationCount = skill._count.certifications;
      return dto;
    });

    return {
      data: transformedSkills,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async findOneSkill(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      include: {
        certifications: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            location: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true,
              },
            },
          },
          take: 10,
        },
        shiftRequirements: {
          include: {
            shift: {
              select: {
                id: true,
                title: true,
                startTime: true,
                locationId: true,
              },
            },
          },
          take: 10,
        },
        _count: {
          select: {
            certifications: true,
            shiftRequirements: true,
          },
        },
      },
    });

    if (!skill) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Skill not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    return {
      ...new SkillResponseDto(skill),
      certificationCount: skill._count.certifications,
      recentCertifications: skill.certifications,
      recentShiftRequirements: skill.shiftRequirements,
    };
  }

  async updateSkill(id: string, updateSkillDto: UpdateSkillDto, userId: string) {
    await this.findOneSkill(id);

    // If name is being updated, check for conflicts
    if (updateSkillDto.name) {
      const existingSkill = await this.prisma.skill.findFirst({
        where: {
          name: updateSkillDto.name,
          id: { not: id },
        },
      });

      if (existingSkill) {
        throw new ConflictException({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Another skill with this name already exists',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    const updatedSkill = await this.prisma.skill.update({
      where: { id },
      data: updateSkillDto,
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'UPDATE',
        entityType: 'Skill',
        entityId: id,
        afterState: JSON.parse(JSON.stringify(updatedSkill)),
      },
    });

    return new SkillResponseDto(updatedSkill);
  }

  async removeSkill(id: string, userId: string) {
    const skill = await this.findOneSkill(id);

    // Check if skill is in use
    if (skill.certificationCount > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Cannot delete skill that is assigned to staff members',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Soft delete
    const updatedSkill = await this.prisma.skill.update({
      where: { id },
      data: { isActive: false },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'DELETE',
        entityType: 'Skill',
        entityId: id,
        afterState: JSON.parse(JSON.stringify(updatedSkill)),
      },
    });

    return {
      success: true,
      message: 'Skill deactivated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async getSkillCategories() {
    const categories = await this.prisma.skill.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return {
      data: categories.map(c => c.category).filter(Boolean),
      timestamp: new Date().toISOString(),
    };
  }

  // ========== CERTIFICATION MANAGEMENT ==========

  async createCertification(createCertificationDto: CreateCertificationDto, certifiedBy: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createCertificationDto.userId },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if skill exists
    const skill = await this.prisma.skill.findUnique({
      where: { id: createCertificationDto.skillId },
    });

    if (!skill) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Skill not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if location exists
    const location = await this.prisma.location.findUnique({
      where: { id: createCertificationDto.locationId },
    });

    if (!location) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Location not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if certification already exists
    const existingCert = await this.prisma.certification.findFirst({
      where: {
        userId: createCertificationDto.userId,
        skillId: createCertificationDto.skillId,
        locationId: createCertificationDto.locationId,
        isActive: true,
      },
    });

    if (existingCert) {
      throw new ConflictException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'User already has this certification at this location',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const certification = await this.prisma.certification.create({
      data: {
        userId: createCertificationDto.userId,
        skillId: createCertificationDto.skillId,
        locationId: createCertificationDto.locationId,
        certifiedBy,
        expiresAt: createCertificationDto.expiresAt,
        isActive: createCertificationDto.isActive ?? true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        skill: true,
        location: true,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        actorId: certifiedBy,
        action: 'CREATE',
        entityType: 'Certification',
        entityId: certification.id,
        afterState: JSON.parse(JSON.stringify(certification)),
      },
    });

    return new CertificationResponseDto(certification);
  }

  async findAllCertifications(
    userId?: string,
    skillId?: string,
    locationId?: string,
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit;
    
    const where: any = { isActive: true };
    
    if (userId) where.userId = userId;
    if (skillId) where.skillId = skillId;
    if (locationId) where.locationId = locationId;

    const [certifications, total] = await Promise.all([
      this.prisma.certification.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          skill: true,
          location: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.certification.count({ where }),
    ]);

    return {
      data: certifications.map(cert => new CertificationResponseDto(cert)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  

async findOneCertification(id: string) {
const certification = await this.prisma.certification.findUnique({
    where: { id },
    include: {
    user: {
        select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        },
    },
    skill: true,
    location: true,
    },
});

if (!certification) {
    throw new NotFoundException({
    success: false,
    error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Certification not found',
    },
    timestamp: new Date().toISOString(),
    });
}

return new CertificationResponseDto(certification);
}

  async revokeCertification(id: string, userId: string) {
    const certification = await this.findOneCertification(id);

    const revokedCert = await this.prisma.certification.update({
      where: { id },
      data: { isActive: false },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'DELETE',
        entityType: 'Certification',
        entityId: id,
        afterState: JSON.parse(JSON.stringify(revokedCert)),
      },
    });

    return {
      success: true,
      message: 'Certification revoked successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async getUserCertifications(userId: string) {
    const certifications = await this.prisma.certification.findMany({
      where: { 
        userId,
        isActive: true,
      },
      include: {
        skill: true,
        location: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: certifications.map(cert => new CertificationResponseDto(cert)),
      timestamp: new Date().toISOString(),
    };
  }

  async getLocationCertifications(locationId: string) {
    const certifications = await this.prisma.certification.findMany({
      where: { 
        locationId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        skill: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by skill
    const groupedBySkill = certifications.reduce((acc, cert) => {
      const skillName = cert.skill.name;
      if (!acc[skillName]) {
        acc[skillName] = [];
      }
      acc[skillName].push({
        id: cert.id,
        user: cert.user,
        certifiedAt: cert.certifiedAt,
        expiresAt: cert.expiresAt,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return {
      data: groupedBySkill,
      total: certifications.length,
      timestamp: new Date().toISOString(),
    };
  }

  async getExpiringCertifications(days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const certifications = await this.prisma.certification.findMany({
      where: {
        isActive: true,
        expiresAt: {
          not: null,
          lte: futureDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        skill: true,
        location: true,
      },
      orderBy: { expiresAt: 'asc' },
    });

    return {
      data: certifications.map(cert => ({
        ...new CertificationResponseDto(cert),
        daysUntilExpiry: Math.ceil((cert.expiresAt!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      })),
      timestamp: new Date().toISOString(),
    };
  }
}