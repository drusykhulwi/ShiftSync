// backend/src/modules/swap-requests/swap-requests.service.ts
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { CreateSwapRequestDto } from './dto/create-swap-request.dto';
import { RespondSwapDto, SwapResponse } from './dto/respond-swap.dto';
import { ApproveSwapDto, ApprovalAction } from './dto/approve-swap.dto';
import { SwapRequestResponseDto } from './dto/swap-request-response.dto';
import { ERROR_CODES } from '../../common/constants/error-codes.constants';
import { ShiftConstraintsValidator } from '../shifts/validators/shift-constraints.validator';
import { SwapRequestStatus, SwapRequestType } from '@prisma/client';
import { differenceInHours, isBefore, addHours } from 'date-fns';

@Injectable()
export class SwapRequestsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
    private shiftValidator: ShiftConstraintsValidator,
  ) {}

  // ========== CREATE SWAP/DROP REQUESTS ==========

  async createSwapRequest(userId: string, createSwapDto: CreateSwapRequestDto) {
    // Check if user has too many pending requests (max 3)
    const pendingCount = await this.prisma.swapRequest.count({
      where: {
        requesterId: userId,
        status: { in: ['PENDING', 'ACCEPTED'] }
      }
    });

    if (pendingCount >= 3) {
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.MAX_PENDING_REQUESTS,
          message: 'You cannot have more than 3 pending swap/drop requests',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Get shift details
    const shift = await this.prisma.shift.findUnique({
      where: { id: createSwapDto.shiftId },
      include: {
        assignments: {
          include: { user: true }
        },
        location: true,
      },
    });

    if (!shift) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.SHIFT_NOT_FOUND,
          message: 'Shift not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Verify user is assigned to this shift
    const isAssigned = shift.assignments.some(a => a.userId === userId);
    if (!isAssigned) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'You can only request swaps for shifts you are assigned to',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if shift is within cutoff period
    const cutoffTime = new Date(shift.startTime.getTime() - shift.cutoffHours * 60 * 60 * 1000);
    if (isBefore(new Date(), cutoffTime)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Cannot request swaps within 48 hours of shift start',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Set expiration for drop requests (24 hours before shift)
    let expiresAt = null;
    if (createSwapDto.type === 'DROP') {
      expiresAt = new Date(shift.startTime.getTime() - 24 * 60 * 60 * 1000);
    }

    // Create swap request
    const swapRequest = await this.prisma.swapRequest.create({
      data: {
        shiftId: createSwapDto.shiftId,
        requesterId: userId,
        responderId: createSwapDto.responderId,
        type: createSwapDto.type,
        status: 'PENDING',
        expiresAt,
      },
      include: {
        shift: {
          include: {
            location: true,
          },
        },
        requester: true,
      },
    });

    // Log audit
    await this.auditService.log({
      actorId: userId,
      action: 'CREATE',
      entityType: 'SwapRequest',
      entityId: swapRequest.id,
      afterState: swapRequest,
    });

    // Send notifications based on type
    if (createSwapDto.type === 'SWAP' && createSwapDto.responderId) {
      // Notify the potential swap partner
      await this.notificationsService.create({
        userId: createSwapDto.responderId,
        type: 'SWAP_REQUESTED',
        title: 'Swap Request',
        message: `${swapRequest.requester.firstName} ${swapRequest.requester.lastName} wants to swap shifts with you`,
        data: { 
          swapRequestId: swapRequest.id,
          shiftId: shift.id,
          shiftTitle: shift.title,
          shiftTime: shift.startTime,
        },
      });
    } else if (createSwapDto.type === 'DROP') {
      // Notify all qualified staff at this location
      await this.notifyQualifiedStaff(shift, swapRequest);
    }

    // Notify managers
    await this.notifyManagers(shift.locationId, {
      type: 'SWAP_REQUESTED',
      title: 'New Swap Request',
      message: `A new ${createSwapDto.type} request needs attention`,
      data: { swapRequestId: swapRequest.id, shiftId: shift.id },
    });

    return new SwapRequestResponseDto(swapRequest);
  }

  // ========== RESPOND TO SWAP REQUEST ==========

  async respondToSwap(userId: string, requestId: string, respondDto: RespondSwapDto) {
    const swapRequest = await this.prisma.swapRequest.findUnique({
      where: { id: requestId },
      include: {
        shift: {
          include: {
            location: true,
            requirements: {
              include: { skill: true }
            },
          },
        },
        requester: true,
      },
    });

    if (!swapRequest) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.SWAP_NOT_FOUND,
          message: 'Swap request not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Verify this user is the intended responder
    if (swapRequest.responderId !== userId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'This swap request was not intended for you',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if request is still pending
    if (swapRequest.status !== 'PENDING') {
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: `This request is already ${swapRequest.status.toLowerCase()}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if expired
    if (swapRequest.expiresAt && isBefore(new Date(), swapRequest.expiresAt)) {
      await this.prisma.swapRequest.update({
        where: { id: requestId },
        data: { status: 'EXPIRED' },
      });

      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.SWAP_EXPIRED,
          message: 'This swap request has expired',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if shift has been modified
   const shift = await this.prisma.shift.findUnique({
    where: { id: swapRequest.shiftId },
   });
   if (!shift) {
    throw new NotFoundException({
        success: false,
        error: {
        code: ERROR_CODES.SHIFT_NOT_FOUND,
        message: 'Shift not found',
        },
        timestamp: new Date().toISOString(),
    });
    }

    if (shift.updatedAt > swapRequest.createdAt) {
      await this.prisma.swapRequest.update({
        where: { id: requestId },
        data: { status: 'CANCELLED' },
      });

      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'This shift has been modified since the request was created',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Validate that responder is qualified if accepting
    if (respondDto.response === 'ACCEPT') {
      const requirement = swapRequest.shift.requirements[0]; // Get first requirement
      const validation = await this.shiftValidator.validateAssignment(
        swapRequest.shiftId,
        userId,
        requirement.id
      );

      if (!validation.valid) {
        throw new BadRequestException({
          success: false,
          error: {
            code: ERROR_CODES.SHIFT_CONFLICT,
            message: 'You are not eligible for this shift',
            details: validation.violations,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Update request status
    const newStatus = respondDto.response === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
    const updatedRequest = await this.prisma.swapRequest.update({
      where: { id: requestId },
      data: { status: newStatus },
      include: {
        requester: true,
        responder: true,
      },
    });

    // Log audit
    await this.auditService.log({
      actorId: userId,
      action: 'UPDATE',
      entityType: 'SwapRequest',
      entityId: requestId,
      afterState: updatedRequest,
    });

    // Notify requester
    await this.notificationsService.create({
      userId: swapRequest.requesterId,
      type: respondDto.response === 'ACCEPT' ? 'SWAP_ACCEPTED' : 'SWAP_DECLINED',
      title: `Swap Request ${respondDto.response === 'ACCEPT' ? 'Accepted' : 'Declined'}`,
      message: `${updatedRequest.responder?.firstName} ${updatedRequest.responder?.lastName} has ${respondDto.response === 'ACCEPT' ? 'accepted' : 'declined'} your swap request`,
      data: { 
        swapRequestId: requestId,
        shiftId: swapRequest.shiftId,
        response: respondDto.response,
        message: respondDto.message,
      },
    });

    // If accepted, notify managers for approval
    if (respondDto.response === 'ACCEPT') {
      await this.notifyManagers(swapRequest.shift.locationId, {
        type: 'SWAP_REQUESTED',
        title: 'Swap Ready for Approval',
        message: 'A swap request has been accepted and needs your approval',
        data: { 
          swapRequestId: requestId,
          shiftId: swapRequest.shiftId,
          requester: swapRequest.requester,
          responder: updatedRequest.responder,
        },
      });
    }

    return new SwapRequestResponseDto(updatedRequest);
  }

  // ========== APPROVE/REJECT SWAP (MANAGER) ==========

  async approveSwap(managerId: string, requestId: string, approveDto: ApproveSwapDto) {
    const swapRequest = await this.prisma.swapRequest.findUnique({
      where: { id: requestId },
      include: {
        shift: {
          include: {
            location: {
              include: { managers: true }
            },
            assignments: true,
          },
        },
        requester: true,
        responder: true,
      },
    });

    if (!swapRequest) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.SWAP_NOT_FOUND,
          message: 'Swap request not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Verify manager has authority
    const isManager = swapRequest.shift.location.managers.some(m => m.id === managerId);
    if (!isManager) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'You do not have permission to approve swaps at this location',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if request is in correct state
    if (swapRequest.status !== 'ACCEPTED') {
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: `Cannot ${approveDto.action.toLowerCase()} a request that is ${swapRequest.status.toLowerCase()}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (approveDto.action === 'APPROVE') {
      // Execute the swap in a transaction
      await this.prisma.$transaction(async (prisma) => {
        // Find original assignment
        const originalAssignment = await prisma.shiftAssignment.findFirst({
          where: {
            shiftId: swapRequest.shiftId,
            userId: swapRequest.requesterId,
          },
        });

        if (!originalAssignment) {
          throw new NotFoundException('Original assignment not found');
        }

        // Update assignment to new user
        if (!swapRequest.responderId) {
            throw new BadRequestException({
                success: false,
                error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Cannot approve swap without a responder',
                },
                timestamp: new Date().toISOString(),
            });
        }

        await prisma.shiftAssignment.update({
            where: { id: originalAssignment.id },
            data: { userId: swapRequest.responderId },
        });

        // Update swap request status
        await prisma.swapRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            resolvedAt: new Date(),
            resolvedBy: managerId,
          },
        });
      });

      // Notify both parties
      await this.notificationsService.create({
        userId: swapRequest.requesterId,
        type: 'SWAP_APPROVED',
        title: 'Swap Approved',
        message: `Your swap with ${swapRequest.responder?.firstName} has been approved`,
        data: { swapRequestId: requestId, shiftId: swapRequest.shiftId },
      });

      if (swapRequest.responderId) {
        await this.notificationsService.create({
            userId: swapRequest.responderId,
            type: 'SWAP_APPROVED',
            title: 'Swap Approved',
            message: `Your swap with ${swapRequest.requester.firstName} has been approved`,
            data: { swapRequestId: requestId, shiftId: swapRequest.shiftId },
        });
      }

    } else {
      // Reject the swap
      await this.prisma.swapRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          resolvedAt: new Date(),
          resolvedBy: managerId,
        },
      });

      // Notify both parties
      await this.notificationsService.create({
        userId: swapRequest.requesterId,
        type: 'SWAP_REJECTED',
        title: 'Swap Rejected',
        message: `Your swap request was rejected${approveDto.reason ? ': ' + approveDto.reason : ''}`,
        data: { swapRequestId: requestId, shiftId: swapRequest.shiftId, reason: approveDto.reason },
      });

      if (swapRequest.responderId) {
        await this.notificationsService.create({
            userId: swapRequest.responderId,
            type: 'SWAP_REJECTED',
            title: 'Swap Rejected',
            message: `The swap request was rejected${approveDto.reason ? ': ' + approveDto.reason : ''}`,
            data: { swapRequestId: requestId, shiftId: swapRequest.shiftId, reason: approveDto.reason },
        });
      }
    }

    // Log audit
    await this.auditService.log({
      actorId: managerId,
      action: approveDto.action === 'APPROVE' ? 'APPROVE' : 'REJECT',
      entityType: 'SwapRequest',
      entityId: requestId,
      afterState: { status: approveDto.action === 'APPROVE' ? 'APPROVED' : 'REJECTED' },
    });

    return this.findOne(requestId);
  }

  // ========== CANCEL SWAP REQUEST ==========

  async cancelRequest(userId: string, requestId: string) {
    const swapRequest = await this.prisma.swapRequest.findUnique({
      where: { id: requestId },
      include: {
        shift: true,
      },
    });

    if (!swapRequest) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.SWAP_NOT_FOUND,
          message: 'Swap request not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Only requester or manager can cancel
    if (swapRequest.requesterId !== userId) {
      // Check if user is a manager at this location
      const isManager = await this.prisma.location.findFirst({
        where: {
          id: swapRequest.shift.locationId,
          managers: { some: { id: userId } }
        },
      });

      if (!isManager) {
        throw new ForbiddenException({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'You do not have permission to cancel this request',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Can only cancel if pending
    if (!['PENDING', 'ACCEPTED'].includes(swapRequest.status)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: `Cannot cancel a request that is ${swapRequest.status.toLowerCase()}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const cancelled = await this.prisma.swapRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    // Log audit
    await this.auditService.log({
      actorId: userId,
      action: 'DELETE',
      entityType: 'SwapRequest',
      entityId: requestId,
      beforeState: swapRequest,
      afterState: cancelled,
    });

    // Notify responder if exists
    if (swapRequest.responderId) {
      await this.notificationsService.create({
        userId: swapRequest.responderId,
        type: 'SWAP_DECLINED',
        title: 'Swap Request Cancelled',
        message: 'A swap request has been cancelled',
        data: { swapRequestId: requestId, shiftId: swapRequest.shiftId },
      });
    }

    return {
      success: true,
      message: 'Swap request cancelled successfully',
      timestamp: new Date().toISOString(),
    };
  }

  // ========== FIND SWAP REQUESTS ==========

  async findAll(
    userId: string,
    userRole: string,
    filters?: {
      status?: SwapRequestStatus;
      type?: SwapRequestType;
      locationId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;

    // Filter by location if provided
    if (filters?.locationId) {
      where.shift = { locationId: filters.locationId };
    }

    // For managers, show all requests at their locations
    if (userRole === 'MANAGER') {
      const managedLocations = await this.prisma.location.findMany({
        where: { managers: { some: { id: userId } } },
        select: { id: true },
      });
      const locationIds = managedLocations.map(l => l.id);
      
      where.shift = {
        ...where.shift,
        locationId: { in: locationIds }
      };
    } 
    // For staff, show their own requests and requests they can respond to
    else if (userRole === 'STAFF') {
      where.OR = [
        { requesterId: userId },
        { responderId: userId },
        { 
          type: 'DROP',
          status: 'PENDING',
          shift: {
            assignments: {
              none: { userId }
            }
          }
        }
      ];
    }

    const [requests, total] = await Promise.all([
      this.prisma.swapRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          shift: {
            include: {
              location: true,
            },
          },
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          responder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.swapRequest.count({ where }),
    ]);

    const transformedRequests = requests.map(request => {
      const dto = new SwapRequestResponseDto(request);
      if (request.expiresAt) {
        dto.timeUntilExpiry = differenceInHours(request.expiresAt, new Date());
      }
      return dto;
    });

    return {
      data: transformedRequests,
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

  async findOne(id: string) {
    const request = await this.prisma.swapRequest.findUnique({
      where: { id },
      include: {
        shift: {
          include: {
            location: true,
            requirements: {
              include: { skill: true }
            },
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        responder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.SWAP_NOT_FOUND,
          message: 'Swap request not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const dto = new SwapRequestResponseDto(request);
    if (request.expiresAt) {
      dto.timeUntilExpiry = differenceInHours(request.expiresAt, new Date());
    }

    return dto;
  }

  async findAvailableDrops(locationId?: string, skillId?: string) {
    const where: any = {
      type: 'DROP',
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    };

    if (locationId) {
      where.shift = { locationId };
    }

    if (skillId) {
      where.shift = {
        ...where.shift,
        requirements: {
          some: { skillId }
        }
      };
    }

    const drops = await this.prisma.swapRequest.findMany({
      where,
      include: {
        shift: {
          include: {
            location: true,
            requirements: {
              include: { skill: true }
            },
          },
        },
        requester: {
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true, // Add email
            },
        },
      },
      orderBy: { expiresAt: 'asc' },
    });

    return drops.map(drop => new SwapRequestResponseDto(drop));
  }

  // ========== UTILITY METHODS ==========

  private async notifyQualifiedStaff(shift: any, swapRequest: any) {
    // Find staff qualified for this shift
    const qualifiedStaff = await this.prisma.user.findMany({
      where: {
        role: 'STAFF',
        certifications: {
          some: {
            locationId: shift.locationId,
            skillId: { in: shift.requirements?.map((r: any) => r.skillId) },
            isActive: true,
          },
        },
        NOT: {
          id: swapRequest.requesterId,
        },
      },
    });

    // Notify each qualified staff member
    for (const staff of qualifiedStaff) {
      await this.notificationsService.create({
        userId: staff.id,
        type: 'DROP_REQUESTED',
        title: 'Shift Available for Pickup',
        message: `A shift at ${shift.location.name} on ${shift.startTime} is available`,
        data: {
          swapRequestId: swapRequest.id,
          shiftId: shift.id,
          shiftTitle: shift.title,
          shiftTime: shift.startTime,
          location: shift.location.name,
        },
      });
    }
  }

  private async notifyManagers(locationId: string, notification: any) {
    const managers = await this.prisma.user.findMany({
      where: {
        role: 'MANAGER',
        managedLocations: { some: { id: locationId } },
      },
    });

    for (const manager of managers) {
      await this.notificationsService.create({
        userId: manager.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
      });
    }
  }

  async cleanupExpiredRequests() {
    const { count } = await this.prisma.swapRequest.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    return {
      success: true,
      message: `Expired ${count} swap requests`,
      timestamp: new Date().toISOString(),
    };
  }
}